import { SECCIONES_OBLIGATORIAS, type Tienda } from "./tipos";

export type ItemRevision = { ok: boolean; texto: string; nivel: "requisito" | "sugerencia" };

function hexARgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminancia([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contraste(a: string, b: string): number | null {
  const x = hexARgb(a);
  const y = hexARgb(b);
  if (!x || !y) return null;
  const l1 = luminancia(x);
  const l2 = luminancia(y);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function revisarTienda(t: Tienda): ItemRevision[] {
  const items: ItemRevision[] = [];
  const req = (ok: boolean, texto: string) => items.push({ ok, texto, nivel: "requisito" });
  const sug = (ok: boolean, texto: string) => items.push({ ok, texto, nivel: "sugerencia" });

  req(!!t.negocio.nombre.trim(), "La tienda tiene el nombre del negocio");
  req(t.productos.length >= 6, `Al menos 6 productos (tiene ${t.productos.length})`);

  const malos = t.productos.filter(
    (p) => !p.nombre.trim() || !Number.isInteger(p.precio) || p.precio <= 0 || !p.categoria.trim(),
  );
  req(malos.length === 0, malos.length ? `Productos con nombre, precio o categoría inválidos: ${malos.map((p) => p.nombre || p.id).join(", ")}` : "Todos los productos tienen nombre, precio entero en COP y categoría");

  const sinFoto = t.productos.filter((p) => !p.imagen || p.imagen.includes("placehold"));
  req(sinFoto.length === 0, sinFoto.length ? `Faltan fotos de: ${sinFoto.map((p) => p.nombre).join(", ")}` : "Todos los productos tienen foto");

  const propias = t.productos.filter((p) => p.imagen.startsWith("foto:")).length;
  sug(propias === t.productos.length, propias === t.productos.length ? "Todas las fotos son propias del negocio" : `Fotos propias del negocio: ${propias} de ${t.productos.length} (las demás vienen de internet)`);

  const wsp = String(t.negocio.whatsapp).replace(/\D/g, "");
  req(/^57\d{10}$/.test(wsp), /^57\d{10}$/.test(wsp) ? "WhatsApp configurado" : "Falta un WhatsApp válido (formato 57 + 10 dígitos)");

  const faltan = SECCIONES_OBLIGATORIAS.filter((s) => !t.secciones.includes(s));
  req(faltan.length === 0, faltan.length ? `Faltan secciones obligatorias: ${faltan.join(", ")}` : "Están todas las secciones obligatorias");

  req(t.beneficios.length >= 3 && t.beneficios.length <= 4, `Entre 3 y 4 beneficios (tiene ${t.beneficios.length})`);
  req(t.pagos.metodos.length > 0, "Tiene al menos un medio de pago");
  const hayTransferencia = t.pagos.metodos.some((m) => m.tipo === "transferencia");
  if (hayTransferencia)
    req(String(t.pagos.numeroTransferencia).replace(/\D/g, "").length >= 10, "Número para transferencias configurado");

  const c = t.tema.colores;
  const c1 = contraste(c.texto, c.fondo);
  if (c1 !== null) req(c1 >= 4.5, `Contraste texto/fondo legible (${c1.toFixed(1)}:1, mínimo 4.5)`);
  const c2 = contraste(c.textoSobrePrimario, c.primario);
  if (c2 !== null) req(c2 >= 3, `Contraste de botones legible (${c2.toFixed(1)}:1, mínimo 3)`);
  const c3 = contraste(c.textoSuave, c.fondo);
  if (c3 !== null) sug(c3 >= 3, `Contraste del texto secundario (${c3.toFixed(1)}:1, recomendado 3+)`);
  const c4 = contraste(c.primario, c.fondo);
  if (c4 !== null) sug(c4 >= 2.5, `El color principal resalta sobre el fondo (${c4.toFixed(1)}:1)`);

  const url = t.backend?.url || "";
  if (url)
    req(/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url), "La URL del backend es una aplicación web de Apps Script (termina en /exec)");

  sug(t.textos.heroTitulo.trim().toUpperCase() !== "GLAXON" || t.negocio.nombre === "GLAXON", "El hero ya no dice GLAXON");
  return items;
}

export function resumenRevision(items: ItemRevision[]): string {
  const fallas = items.filter((i) => !i.ok);
  if (!fallas.length) return "Revisión: todo en orden.";
  return "Revisión — pendientes:\n" + fallas.map((i) => `- [${i.nivel}] ${i.texto}`).join("\n");
}
