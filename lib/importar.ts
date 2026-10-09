import JSZip from "jszip";
import type { Tienda } from "./tipos";
import type { Foto } from "./fotos";
import { TIENDA_BASE } from "./glaxon";
import { mezclar, normalizarTienda } from "./cambios";

// Recupera una tienda descargada antes (zip, carpeta o archivos sueltos) para seguir editándola.
// Si el index.html trae el proyecto guardado (descargas nuevas) se recupera exacto;
// si no (descargas antiguas), se reconstruye leyendo el HTML, el CSS y los datos.

export type ResultadoImportacion = { tienda: Tienda; fotos: Foto[]; exacta: boolean; avisos: string[] };

type Archivo = { ruta: string; texto?: () => Promise<string>; dataUrl?: () => Promise<string> };

const FOTO_PENDIENTE = "https://placehold.co/600x600/png?text=Foto+pendiente";
const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

function leerComoDataUrl(f: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

async function listarArchivos(entrada: File[]): Promise<Archivo[]> {
  const lista: Archivo[] = [];
  for (const f of entrada) {
    const ruta = (f.webkitRelativePath || f.name).replace(/\\/g, "/");
    if (/\.zip$/i.test(f.name)) {
      const zip = await JSZip.loadAsync(f);
      zip.forEach((r, e) => {
        if (e.dir) return;
        const ext = r.split(".").pop()!.toLowerCase();
        lista.push({
          ruta: r,
          texto: () => e.async("string"),
          dataUrl: async () => `data:${MIME[ext] || "application/octet-stream"};base64,${await e.async("base64")}`,
        });
      });
    } else {
      lista.push({ ruta, texto: () => f.text(), dataUrl: () => leerComoDataUrl(f) });
    }
  }
  return lista;
}

// Extrae el objeto JSON que sigue a "window.TIENDA_DATOS =" contando llaves.
function extraerDatos(js: string): Record<string, any> | null {
  const i = js.indexOf("window.TIENDA_DATOS");
  if (i < 0) return null;
  const ini = js.indexOf("{", i);
  let nivel = 0, enTexto = false, escape = false;
  for (let k = ini; k < js.length; k++) {
    const ch = js[k];
    if (enTexto) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') enTexto = false;
    } else if (ch === '"') enTexto = true;
    else if (ch === "{") nivel++;
    else if (ch === "}" && --nivel === 0) {
      try {
        return JSON.parse(js.slice(ini, k + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function variableCss(css: string, nombre: string): string {
  const m = css.match(new RegExp(`--${nombre}:\\s*([^;]+);`));
  return m ? m[1].trim() : "";
}

function primeraFuente(valor: string): string {
  const m = valor.match(/'([^']+)'|"([^"]+)"/);
  return m ? m[1] || m[2] : "";
}

function esOscuro(hex: string): boolean {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return true;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

export async function importarTienda(entrada: File[]): Promise<ResultadoImportacion> {
  const archivos = await listarArchivos(entrada);
  const avisos: string[] = [];
  const porNombre = (re: RegExp) =>
    archivos.filter((a) => re.test(a.ruta)).sort((a, b) => a.ruta.split("/").length - b.ruta.split("/").length)[0];

  const archHtml = porNombre(/(^|\/)index\.html?$/i) || porNombre(/\.html?$/i);
  const archJs = porNombre(/(^|\/)script\.js$/i);
  const archCss = porNombre(/(^|\/)styles\.css$/i);
  if (!archHtml && !archJs) throw new Error("No encontré index.html ni script.js. Sube el .zip que descargaste de Harvys o la carpeta del proyecto.");

  const html = archHtml ? await archHtml.texto!() : "";
  const js = archJs ? await archJs.texto!() : "";
  const cssExterno = archCss ? await archCss.texto!() : "";

  // ----- Fotos de la carpeta img/ -----
  const fotos: Foto[] = [];
  const refPorRuta = new Map<string, string>();
  for (const a of archivos) {
    const m = a.ruta.match(/(?:^|\/)img\/([^/]+\.(jpe?g|png|webp|gif))$/i);
    if (!m) continue;
    const nombre = m[1];
    const id = nombre.match(/-([a-z0-9]{6})\.\w+$/i)?.[1] || Math.random().toString(36).slice(2, 8);
    fotos.push({ id, nombre, dataUrl: await a.dataUrl!() });
    refPorRuta.set(`img/${nombre}`, `foto:${id}`);
  }
  const idsFotos = new Set(fotos.map((f) => f.id));
  const convertirImagen = (src: string | null | undefined): string => {
    if (!src) return "";
    if (/^https?:|^data:/.test(src)) return src;
    const limpio = src.replace(/^\.?\//, "");
    return refPorRuta.get(limpio) || FOTO_PENDIENTE;
  };

  // ----- 1) Proyecto guardado dentro del index.html (descargas nuevas) -----
  const doc = new DOMParser().parseFromString(html || "<html></html>", "text/html");
  const guardado = doc.getElementById("harvys-proyecto")?.textContent;
  if (guardado) {
    try {
      const tienda = normalizarTienda(mezclar(TIENDA_BASE, JSON.parse(guardado)) as Tienda);
      const faltan = tienda.productos.filter((p) => p.imagen.startsWith("foto:") && !idsFotos.has(p.imagen.slice(5)));
      if (faltan.length) avisos.push(`Faltan ${faltan.length} foto(s) (no venía la carpeta img/): ${faltan.map((p) => p.nombre).join(", ")}.`);
      return { tienda, fotos, exacta: true, avisos };
    } catch {
      avisos.push("La copia guardada del proyecto estaba dañada; reconstruí la tienda desde los archivos.");
    }
  }

  // ----- 2) Reconstrucción desde los archivos (descargas antiguas) -----
  const scriptsInline = [...doc.querySelectorAll("script:not([src])")].map((s) => s.textContent || "").join("\n");
  const datos = extraerDatos(js) || extraerDatos(scriptsInline);
  if (!datos) throw new Error("No encontré los datos de la tienda (productos y pagos). ¿Es una tienda descargada de Harvys?");

  const css = cssExterno || [...doc.querySelectorAll("style")].map((s) => s.textContent || "").join("\n");
  const txt = (sel: string) => doc.querySelector(sel)?.textContent?.trim() || "";
  const t: Tienda = structuredClone(TIENDA_BASE);
  const nombre = String(datos.nombre || txt(".footer-marca h3") || "Mi tienda");

  // Negocio
  const titulo = doc.title || "";
  t.negocio = {
    ...t.negocio,
    nombre,
    descripcion: doc.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    eslogan: titulo.includes(" — ") ? titulo.split(" — ").slice(1).join(" — ") : "",
    whatsapp: String(datos.whatsapp || ""),
    instagram: "",
    facebook: "",
    tiktok: "",
    ciudad: "",
    horarios: [...doc.querySelectorAll(".horarios-lista li")].map((li) => (li.textContent || "").replace(/^🕒\s*/, "").trim()),
    logo: convertirImagen(doc.querySelector(".hero-logo")?.getAttribute("src")),
  };
  doc.querySelectorAll(".footer-col li").forEach((li) => {
    const texto = li.textContent?.trim() || "";
    const href = li.querySelector("a")?.getAttribute("href") || "";
    if (/instagram\.com/.test(href)) t.negocio.instagram = href.replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
    else if (/tiktok\.com/.test(href)) t.negocio.tiktok = href.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "");
    else if (/^Facebook/.test(texto)) t.negocio.facebook = href || texto.replace(/^Facebook:\s*/, "");
    else if (texto.startsWith("📍")) t.negocio.ciudad = texto.replace(/^📍\s*/, "");
  });

  // Productos y pagos
  t.productos = (datos.productos || []).map((p: any) => ({ ...p, imagen: convertirImagen(p.imagen) }));
  if (datos.pagos) t.pagos = { ...t.pagos, ...datos.pagos };
  t.backend = { url: String(datos.backend || "") };

  // Tema (variables de :root y clases del body)
  const colores = {
    primario: variableCss(css, "p"), textoSobrePrimario: variableCss(css, "p-txt"), acento: variableCss(css, "acc"),
    fondo: variableCss(css, "bg"), fondoAlterno: variableCss(css, "bg2"), tarjeta: variableCss(css, "card"),
    texto: variableCss(css, "tx"), textoSuave: variableCss(css, "tx2"),
  };
  Object.entries(colores).forEach(([k, v]) => { if (v) (t.tema.colores as Record<string, string>)[k] = v; });
  const ft = primeraFuente(variableCss(css, "ft"));
  const fb = primeraFuente(variableCss(css, "fb"));
  if (ft) t.tema.fuentes.titulos = ft;
  if (fb) t.tema.fuentes.cuerpo = fb;
  const radio = parseInt(variableCss(css, "r"), 10);
  if (!Number.isNaN(radio)) t.tema.radio = radio;
  t.tema.titulosMayusculas = variableCss(css, "tt") === "uppercase";
  t.tema.modo = esOscuro(t.tema.colores.fondo) ? "oscuro" : "claro";
  t.tema.nombreEstilo = "Recuperado";
  const clases = doc.body.className;
  const clase = (prefijo: string) => clases.match(new RegExp(`${prefijo}-(\\w+)`))?.[1];
  t.tema.animaciones = (clase("anim") as Tienda["tema"]["animaciones"]) || t.tema.animaciones;
  t.tema.tarjetas = (clase("tarj") as Tienda["tema"]["tarjetas"]) || t.tema.tarjetas;
  const heroClase = doc.querySelector("header.hero")?.className.match(/hero-(centrado|dividido|compacto)/)?.[1];
  if (heroClase) t.tema.hero = heroClase as Tienda["tema"]["hero"];
  const efecto = doc.querySelector(".hero-bg")?.className.match(/efecto-(\w+)/)?.[1];
  if (efecto) t.tema.fondoEfecto = efecto as Tienda["tema"]["fondoEfecto"];

  // Textos
  const h1 = doc.querySelector(".hero h1");
  const tx = t.textos;
  if (h1) {
    tx.heroTitulo = [...h1.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
    tx.heroTituloResaltado = h1.querySelector("span")?.textContent?.trim() || "";
  }
  tx.heroEtiqueta = txt(".hero-badge");
  tx.heroSubtitulo = txt(".hero-sub");
  tx.heroBoton = txt(".btn-hero") || tx.heroBoton;
  tx.heroImagen = convertirImagen(doc.querySelector(".hero-img")?.getAttribute("src"));
  tx.estadisticas = [...doc.querySelectorAll(".hero-stat")].map((s) => {
    const valor = s.querySelector(".num")?.textContent?.trim() || "";
    return { valor: valor === String(t.productos.length) ? "{productos}" : valor, etiqueta: s.querySelector(".lbl")?.textContent?.trim() || "" };
  });
  const h2 = doc.querySelector(".banner-content h2");
  if (h2) {
    tx.bannerTitulo = [...h2.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
    tx.bannerTituloResaltado = h2.querySelector("em")?.textContent?.trim() || "";
    tx.bannerEtiqueta = txt(".banner-content .sec-label");
    tx.bannerTexto = txt(".banner-content p");
    tx.chips = [...doc.querySelectorAll(".banner-chips .chip")].map((c) => c.textContent?.trim() || "");
  }
  const etiquetas: [string, keyof typeof tx, keyof typeof tx][] = [
    ["#catalogo", "catalogoEtiqueta", "catalogoTitulo"],
    [".beneficios-sec", "beneficiosEtiqueta", "beneficiosTitulo"],
    [".recs-sec", "recomendadosEtiqueta", "recomendadosTitulo"],
    [".top-sec", "topEtiqueta", "topTitulo"],
    [".duelo-sec", "dueloEtiqueta", "dueloTitulo"],
    [".testimonios-sec", "testimoniosEtiqueta", "testimoniosTitulo"],
    [".horarios-sec", "horariosEtiqueta", "horariosTitulo"],
  ];
  for (const [sel, et, ti] of etiquetas) {
    if (!doc.querySelector(sel)) continue;
    (tx as Record<string, unknown>)[et] = txt(`${sel} .sec-label`);
    (tx as Record<string, unknown>)[ti] = txt(`${sel} .sec-title`);
  }
  tx.dueloInfo = txt(".duelo-info") || tx.dueloInfo;
  tx.botonAgregar = String(datos.botonAgregar || tx.botonAgregar);
  tx.footerTexto = txt(".footer-marca p");
  tx.footerFrase = doc.querySelectorAll(".footer-bottom span")[1]?.textContent?.trim() || "";
  tx.carritoTitulo = txt(".panel-header h3") || tx.carritoTitulo;
  tx.botonPagar = txt(".btn-pagar") || tx.botonPagar;

  t.beneficios = [...doc.querySelectorAll(".bcard")].map((b) => ({
    icono: b.querySelector(".bcard-icono")?.textContent?.trim() || "",
    titulo: b.querySelector("h3")?.textContent?.trim() || "",
    texto: b.querySelector("p")?.textContent?.trim() || "",
  }));
  t.testimonios = [...doc.querySelectorAll(".testimonio")].map((x) => ({
    texto: x.querySelector("p")?.textContent?.trim() || "",
    nombre: (x.querySelector("strong")?.textContent || "").replace(/^—\s*/, "").trim(),
  }));

  // Secciones (en el orden en que aparecen) y personalizaciones
  const mapa: [string, string][] = [
    ["banner-sec", "banner"], ["catalogo-wrap", "catalogo"], ["beneficios-sec", "beneficios"], ["recs-sec", "recomendados"],
    ["top-sec", "top"], ["duelo-sec", "duelo"], ["testimonios-sec", "testimonios"], ["horarios-sec", "horarios"],
  ];
  const secciones: string[] = [];
  const personalizadas: { id: string; html: string }[] = [];
  doc.querySelectorAll("body > section").forEach((s) => {
    if (s.classList.contains("seccion-personalizada")) {
      const id = s.id.replace(/^custom-/, "") || `seccion${personalizadas.length + 1}`;
      personalizadas.push({ id, html: s.innerHTML.trim() });
      secciones.push(`custom:${id}`);
      return;
    }
    const id = mapa.find(([c]) => s.classList.contains(c))?.[1];
    if (id) secciones.push(id);
  });
  if (secciones.length) t.secciones = secciones;
  const marca = "/* ===== CSS PERSONALIZADO ===== */";
  t.personalizado = {
    css: css.includes(marca) ? css.slice(css.indexOf(marca) + marca.length).trim() : "",
    secciones: personalizadas,
  };

  const pendientes = t.productos.filter((p) => p.imagen === FOTO_PENDIENTE);
  if (pendientes.length) avisos.push(`Faltan ${pendientes.length} foto(s) (no venía la carpeta img/): ${pendientes.map((p) => p.nombre).join(", ")}.`);
  avisos.push("Esta tienda se descargó con una versión anterior: la reconstruí desde los archivos. Revisa que todo esté bien.");
  return { tienda: normalizarTienda(t), fotos, exacta: false, avisos };
}
