import type { Tienda } from "./tipos";

// Genera el Code.gs (Google Apps Script) que convierte una hoja de Google en el backend
// de la tienda: productos con stock y registro de pedidos.
export function generarAppsScript(t: Tienda, resolverImagen: (ref: string) => string): string {
  const productos = t.productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    categoria: p.categoria,
    imagen: resolverImagen(p.imagen),
    descripcion: p.descripcion || "",
    opcion_etiqueta: p.opciones?.etiqueta || "",
    opcion_valores: p.opciones?.valores.join(", ") || "",
    destacado: p.destacado ? "SI" : "NO",
  }));
  const nombre = t.negocio.nombre;

  return `/**
 * ============================================================
 *  BACKEND DE ${nombre.toUpperCase()} — Google Sheets + Apps Script
 *  Generado con Harvys, asistente de e-commerce del Profesor Harvey Sanabria
 * ============================================================
 *
 *  ▶ PASO 1 — EJECUTA ESTO PRIMERO
 *    Arriba, en la lista de funciones, elige "configurarTienda" y pulsa ▶ Ejecutar.
 *    Autoriza los permisos (es tu propio script). Se crean las hojas
 *    "Productos" (con tus productos) y "Pedidos".
 *
 *  ▶ PASO 2 — PUBLICAR COMO APLICACIÓN WEB
 *    Implementar → Nueva implementación → ⚙ Tipo: Aplicación web
 *      · Ejecutar como: Yo
 *      · Quién tiene acceso: Cualquier usuario
 *    Pulsa Implementar y copia la URL que termina en /exec.
 *
 *  ▶ PASO 3 — CONECTAR LA TIENDA
 *    Pega la URL en el chat de Harvys. Después descarga de nuevo tu
 *    proyecto y publícalo en GitHub Pages.
 *
 *  Cómo se usa después:
 *    · Edita precios y stock directamente en la hoja "Productos".
 *      Stock vacío = sin límite. Activo = NO oculta el producto.
 *    · Cada pedido enviado por WhatsApp queda registrado en "Pedidos".
 *    · Si cambias ESTE código: Implementar → Gestionar implementaciones →
 *      ✏ Editar → Versión: Nueva versión → Implementar.
 */

var COLUMNAS_PRODUCTOS = ["id", "nombre", "precio", "categoria", "imagen", "descripcion",
  "opcion_etiqueta", "opcion_valores", "stock", "activo", "destacado"];
var COLUMNAS_PEDIDOS = ["fecha", "pedido", "productos", "total", "metodo_pago", "estado"];
var STOCK_INICIAL = 10;

var PRODUCTOS_INICIALES = ${JSON.stringify(productos, null, 2)};

/* ===================== PASO 1 ===================== */
function configurarTienda() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();

  var hoja = libro.getSheetByName("Productos");
  if (hoja && hoja.getLastRow() > 1) {
    Logger.log("La hoja Productos ya tiene datos: no se modificó.");
  } else {
    if (!hoja) hoja = libro.insertSheet("Productos");
    hoja.clear();
    var filas = [COLUMNAS_PRODUCTOS];
    PRODUCTOS_INICIALES.forEach(function (p) {
      filas.push([p.id, p.nombre, p.precio, p.categoria, p.imagen, p.descripcion,
        p.opcion_etiqueta, p.opcion_valores, STOCK_INICIAL, "SI", p.destacado]);
    });
    hoja.getRange(1, 1, filas.length, COLUMNAS_PRODUCTOS.length).setValues(filas);
    hoja.getRange(2, 3, filas.length - 1, 1).setNumberFormat("$#,##0");
    darFormato(hoja, COLUMNAS_PRODUCTOS.length);
    Logger.log("Hoja Productos creada con " + PRODUCTOS_INICIALES.length + " productos.");
  }

  var pedidos = libro.getSheetByName("Pedidos");
  if (!pedidos) {
    pedidos = libro.insertSheet("Pedidos");
    pedidos.getRange(1, 1, 1, COLUMNAS_PEDIDOS.length).setValues([COLUMNAS_PEDIDOS]);
    pedidos.getRange("D:D").setNumberFormat("$#,##0");
    darFormato(pedidos, COLUMNAS_PEDIDOS.length);
    Logger.log("Hoja Pedidos creada.");
  }

  // Quita la hoja vacía que Google crea por defecto
  libro.getSheets().forEach(function (h) {
    var n = h.getName();
    if ((n === "Hoja 1" || n === "Sheet1" || n === "Hoja1") && h.getLastRow() === 0 && libro.getSheets().length > 1) {
      libro.deleteSheet(h);
    }
  });

  Logger.log("✅ Listo. Ahora sigue el PASO 2: Implementar como aplicación web.");
}

function darFormato(hoja, columnas) {
  hoja.getRange(1, 1, 1, columnas).setFontWeight("bold").setBackground("#1f2937").setFontColor("#ffffff");
  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, columnas);
}

/* ============ LA TIENDA LEE LOS PRODUCTOS (GET) ============ */
function doGet() {
  return respuesta({ ok: true, productos: leerProductos(), actualizado: new Date().toISOString() });
}

function leerProductos() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Productos");
  if (!hoja) return [];
  var datos = hoja.getDataRange().getValues();
  var enc = datos.shift();
  var col = {};
  enc.forEach(function (n, i) { col[String(n).trim()] = i; });

  var lista = [];
  datos.forEach(function (f) {
    var id = String(f[col.id] || "").trim();
    var nombre = String(f[col.nombre] || "").trim();
    if (!id || !nombre) return;
    if (String(f[col.activo]).trim().toUpperCase() === "NO") return;
    var valores = String(f[col.opcion_valores] || "").split(",")
      .map(function (v) { return v.trim(); }).filter(String);
    var stock = f[col.stock];
    lista.push({
      id: id,
      nombre: nombre,
      precio: Math.round(Number(f[col.precio]) || 0),
      categoria: String(f[col.categoria] || "General"),
      imagen: String(f[col.imagen] || ""),
      descripcion: String(f[col.descripcion] || ""),
      opciones: valores.length ? { etiqueta: String(f[col.opcion_etiqueta] || "Opción"), valores: valores } : null,
      destacado: String(f[col.destacado]).trim().toUpperCase() === "SI",
      stock: stock === "" || stock === null ? null : Math.max(0, Math.floor(Number(stock) || 0))
    });
  });
  return lista;
}

/* ============ LA TIENDA REGISTRA UN PEDIDO (POST) ============ */
function doPost(e) {
  var candado = LockService.getScriptLock();
  candado.waitLock(10000);
  try {
    var pedido = JSON.parse(e.postData.contents);
    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = libro.getSheetByName("Productos");
    var datos = hoja.getDataRange().getValues();
    var enc = datos[0];
    var col = {};
    enc.forEach(function (n, i) { col[String(n).trim()] = i; });

    var filaPorId = {};
    for (var i = 1; i < datos.length; i++) filaPorId[String(datos[i][col.id]).trim()] = i;

    var total = 0, detalle = [], problemas = [];
    (pedido.items || []).forEach(function (item) {
      var i = filaPorId[String(item.id)];
      if (i === undefined) { problemas.push("No existe el producto " + item.id); return; }
      var fila = datos[i];
      var cantidad = Math.max(1, parseInt(item.cantidad, 10) || 1);
      var precio = Math.round(Number(fila[col.precio]) || 0);
      total += precio * cantidad;
      detalle.push(cantidad + " x " + fila[col.nombre] + (item.opcion ? " (" + item.opcion + ")" : ""));

      var stock = fila[col.stock];
      if (stock !== "" && stock !== null) {
        stock = Number(stock) || 0;
        if (stock < cantidad) problemas.push("Stock insuficiente: " + fila[col.nombre] + " (quedan " + stock + ")");
        else hoja.getRange(i + 1, col.stock + 1).setValue(stock - cantidad);
      }
    });

    var pedidos = libro.getSheetByName("Pedidos");
    pedidos.appendRow([new Date(), String(pedido.pedidoId || ""), detalle.join("\\n"), total,
      String(pedido.metodo || ""), problemas.length ? "REVISAR: " + problemas.join("; ") : "Nuevo"]);

    return respuesta({ ok: true, pedidoId: pedido.pedidoId, total: total, problemas: problemas });
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  } finally {
    candado.releaseLock();
  }
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
`;
}
