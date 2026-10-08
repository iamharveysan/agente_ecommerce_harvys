import type { Producto, Tienda } from "./tipos";

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Mezcla profunda: los objetos se combinan y los arreglos se reemplazan completos.
export function mezclar<T>(base: T, cambios: unknown): T {
  if (!esObjeto(base) || !esObjeto(cambios)) return (cambios === undefined ? base : cambios) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(cambios)) {
    if (v === undefined) continue;
    out[k] = esObjeto(v) && esObjeto(out[k]) ? mezclar(out[k], v) : v;
  }
  return out as T;
}

function normalizarProducto(p: Partial<Producto>, i: number): Producto {
  return {
    id: String(p.id || `p${Date.now().toString(36)}${i}`),
    nombre: String(p.nombre || "").trim(),
    precio: Math.round(Number(String(p.precio ?? 0).replace(/[^\d.]/g, "")) || 0),
    categoria: String(p.categoria || "General").trim(),
    imagen: String(p.imagen || ""),
    descripcion: p.descripcion ? String(p.descripcion) : undefined,
    opciones: p.opciones && Array.isArray(p.opciones.valores) && p.opciones.valores.length
      ? { etiqueta: String(p.opciones.etiqueta || "Opción"), valores: p.opciones.valores.map(String) }
      : null,
    destacado: !!p.destacado,
  };
}

// Asegura tipos correctos después de cualquier cambio del agente.
export function normalizarTienda(t: Tienda): Tienda {
  const productos = (Array.isArray(t.productos) ? t.productos : []).map(normalizarProducto);
  const ids = new Set<string>();
  for (const p of productos) {
    while (ids.has(p.id)) p.id += "x";
    ids.add(p.id);
  }
  return {
    ...t,
    productos,
    negocio: {
      ...t.negocio,
      whatsapp: String(t.negocio.whatsapp || "").replace(/\D/g, ""),
      horarios: Array.isArray(t.negocio.horarios) ? t.negocio.horarios.map(String) : [],
    },
    tema: { ...t.tema, radio: Math.max(0, Math.min(40, Number(t.tema.radio) || 0)) },
    secciones: Array.isArray(t.secciones) ? [...new Set(t.secciones.map(String))] : [],
    beneficios: Array.isArray(t.beneficios) ? t.beneficios : [],
    testimonios: Array.isArray(t.testimonios) ? t.testimonios : [],
    personalizado: {
      css: String(t.personalizado?.css || ""),
      secciones: Array.isArray(t.personalizado?.secciones) ? t.personalizado.secciones : [],
    },
  };
}

export type OperacionProductos = {
  operacion: "reemplazar_todos" | "agregar" | "actualizar" | "eliminar";
  productos?: Partial<Producto>[];
  ids?: string[];
};

export function aplicarProductos(t: Tienda, op: OperacionProductos): Tienda {
  const lista = op.productos ?? [];
  let productos = t.productos;
  switch (op.operacion) {
    case "reemplazar_todos":
      productos = lista.map(normalizarProducto);
      break;
    case "agregar":
      productos = [...productos, ...lista.map((p, i) => normalizarProducto(p, productos.length + i))];
      break;
    case "actualizar":
      productos = productos.map((p) => {
        const c = lista.find((x) => x.id === p.id);
        return c ? normalizarProducto({ ...p, ...c }, 0) : p;
      });
      break;
    case "eliminar":
      productos = productos.filter((p) => !(op.ids ?? []).includes(p.id));
      break;
  }
  return normalizarTienda({ ...t, productos });
}

export type OperacionSeccion = {
  accion: "crear_o_actualizar" | "eliminar";
  id: string;
  html?: string;
  despues_de?: string;
};

export function aplicarSeccion(t: Tienda, op: OperacionSeccion): Tienda {
  const id = op.id.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const ref = "custom:" + id;
  if (op.accion === "eliminar") {
    return {
      ...t,
      secciones: t.secciones.filter((s) => s !== ref),
      personalizado: { ...t.personalizado, secciones: t.personalizado.secciones.filter((s) => s.id !== id) },
    };
  }
  const otras = t.personalizado.secciones.filter((s) => s.id !== id);
  let secciones = t.secciones;
  if (!secciones.includes(ref)) {
    const pos = op.despues_de ? secciones.indexOf(op.despues_de) : -1;
    secciones = pos >= 0 ? [...secciones.slice(0, pos + 1), ref, ...secciones.slice(pos + 1)] : [...secciones, ref];
  }
  return {
    ...t,
    secciones,
    personalizado: { ...t.personalizado, secciones: [...otras, { id, html: String(op.html || "") }] },
  };
}
