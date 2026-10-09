import type { Tienda } from "./tipos";
import { CSS_TIENDA } from "./tienda-estilos";
import { SCRIPT_TIENDA } from "./tienda-script";

export type OpcionesRender = {
  // Convierte una referencia de imagen ("foto:abc" o URL) en algo que el navegador pueda mostrar.
  resolverImagen: (ref: string) => string;
  // En la vista previa se reportan los errores de JavaScript a la app.
  preview?: boolean;
};

const FUENTES_CONDENSADAS = ["Bebas Neue", "Anton", "Oswald", "League Gothic", "Barlow Condensed", "Teko"];

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function jsonSeguro(v: unknown): string {
  return JSON.stringify(v)
    .replace(/</g, "\\u003c")
    .split(String.fromCharCode(0x2028))
    .join("\\u2028")
    .split(String.fromCharCode(0x2029))
    .join("\\u2029");
}

function familiaCss(nombre: string): string {
  return `'${nombre.replace(/'/g, "")}'`;
}

function enlaceFuente(nombre: string, pesos: boolean): string {
  const fam = encodeURIComponent(nombre.trim()).replace(/%20/g, "+");
  const extra = pesos ? ":wght@400;600;700" : "";
  return `<link href="https://fonts.googleapis.com/css2?family=${fam}${extra}&display=swap" rel="stylesheet">`;
}

function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tienda"
  );
}

function urlRed(valor: string, base: string): string {
  const v = valor.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return base + v.replace(/^@/, "");
}

export type ArchivosTienda = { html: string; css: string; js: string };

// Un solo archivo con todo adentro (vista previa y descarga "todo en uno").
export function renderTienda(t: Tienda, op: OpcionesRender): string {
  return generar(t, op, false).html;
}

// index.html + styles.css + script.js enlazados, listos para GitHub Pages.
export function renderArchivos(t: Tienda, op: OpcionesRender): ArchivosTienda {
  return generar(t, op, true);
}

function generar(t: Tienda, op: OpcionesRender, separado: boolean): ArchivosTienda {
  const { tema, textos, negocio } = t;
  const c = tema.colores;
  const img = op.resolverImagen;
  const oscuro = tema.modo === "oscuro";
  const condensada = FUENTES_CONDENSADAS.includes(tema.fuentes.titulos);
  const heroSize =
    tema.hero === "dividido"
      ? condensada
        ? "clamp(64px,9vw,130px)"
        : "clamp(40px,6vw,82px)"
      : tema.hero === "compacto"
        ? condensada
          ? "clamp(60px,10vw,130px)"
          : "clamp(40px,7vw,90px)"
        : condensada
          ? "clamp(80px,14vw,180px)"
          : "clamp(48px,9vw,120px)";

  const vars = `:root{
  --p:${c.primario};--p-txt:${c.textoSobrePrimario};--acc:${c.acento};
  --bg:${c.fondo};--bg2:${c.fondoAlterno};--card:${c.tarjeta};
  --tx:${c.texto};--tx2:${c.textoSuave};
  --linea:${oscuro ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.09)"};
  --suave:${oscuro ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)"};
  --sombra:${oscuro ? "rgba(0,0,0,.6)" : "rgba(30,30,60,.14)"};
  --r:${tema.radio}px;--rp:${tema.radio <= 6 ? tema.radio + "px" : "100px"};
  --ft:${familiaCss(tema.fuentes.titulos)},${condensada ? "Impact," : ""}sans-serif;
  --fb:${familiaCss(tema.fuentes.cuerpo)},system-ui,sans-serif;
  --tt:${tema.titulosMayusculas ? "uppercase" : "none"};
  --ls:${condensada ? "3px" : tema.titulosMayusculas ? "2px" : "0px"};
  --hero-size:${heroSize};
}`;

  const productos = t.productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: Math.round(Number(p.precio) || 0),
    categoria: p.categoria,
    imagen: img(p.imagen),
    descripcion: p.descripcion || "",
    opciones: p.opciones && p.opciones.valores?.length ? p.opciones : null,
    destacado: !!p.destacado,
  }));

  const datos = {
    clave: "tienda_" + slug(negocio.nombre) + "_",
    nombre: negocio.nombre,
    whatsapp: String(negocio.whatsapp || "").replace(/\D/g, ""),
    botonAgregar: textos.botonAgregar,
    productos,
    pagos: t.pagos,
    backend: t.backend?.url || "",
  };

  const reemplazar = (s: string) => s.replace("{productos}", String(t.productos.length));

  // ----- Hero -----
  const imagenHero = textos.heroImagen || t.productos.find((p) => p.destacado)?.imagen || t.productos[0]?.imagen || "";
  const contenidoHero = `
    <div>
      ${negocio.logo ? `<img src="${esc(img(negocio.logo))}" alt="Logo ${esc(negocio.nombre)}" class="hero-logo">` : ""}
      ${textos.heroEtiqueta ? `<div class="hero-badge">${esc(textos.heroEtiqueta)}</div>` : ""}
      <h1>${esc(textos.heroTitulo)}${textos.heroTituloResaltado ? `<span>${esc(textos.heroTituloResaltado)}</span>` : ""}</h1>
      <p class="hero-sub">${esc(textos.heroSubtitulo)}</p>
      <a href="#catalogo" class="btn-hero">${esc(textos.heroBoton)}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
      ${
        textos.estadisticas?.length
          ? `<div class="hero-stats">${textos.estadisticas
              .map((e) => `<div class="hero-stat"><div class="num">${esc(reemplazar(e.valor))}</div><div class="lbl">${esc(e.etiqueta)}</div></div>`)
              .join("")}</div>`
          : ""
      }
    </div>
    ${tema.hero === "dividido" && imagenHero ? `<img src="${esc(img(imagenHero))}" alt="" class="hero-img">` : ""}`;

  const hero = `
<header class="hero hero-${tema.hero}">
  <div class="hero-bg efecto-${tema.fondoEfecto}"></div>
  <div class="hero-content">${contenidoHero}</div>
  <div class="hero-scroll"><div></div></div>
</header>`;

  // ----- Secciones -----
  const secciones: Record<string, () => string> = {
    banner: () => `
<section class="banner-sec">
  <div class="banner-glow"></div>
  <div class="banner-content">
    <div class="sec-label">${esc(textos.bannerEtiqueta)}</div>
    <h2>${esc(textos.bannerTitulo)} <em>${esc(textos.bannerTituloResaltado)}</em></h2>
    <p>${esc(textos.bannerTexto)}</p>
    ${textos.chips?.length ? `<div class="banner-chips">${textos.chips.map((ch) => `<span class="chip">${esc(ch)}</span>`).join("")}</div>` : ""}
  </div>
</section>`,
    catalogo: () => `
<div class="filtros-wrap" id="filtros-bar">
  <div class="busqueda-wrap">
    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
    <input type="text" id="buscador" placeholder="Buscar producto..." oninput="filtrarBusqueda()">
  </div>
</div>
<section class="catalogo-wrap" id="catalogo">
  <div class="catalogo-header">
    <div><div class="sec-label">${esc(textos.catalogoEtiqueta)}</div><div class="sec-title">${esc(textos.catalogoTitulo)}</div></div>
    <div class="catalogo-count" id="cont-count"></div>
  </div>
  <div id="productos"></div>
</section>`,
    beneficios: () => `
<section class="beneficios-sec" id="beneficios">
  <div class="sec-centro"><div class="sec-label">${esc(textos.beneficiosEtiqueta)}</div><div class="sec-title">${esc(textos.beneficiosTitulo)}</div></div>
  <div class="beneficios-grid">
    ${t.beneficios.map((b) => `<div class="bcard"><div class="bcard-icono">${esc(b.icono)}</div><h3>${esc(b.titulo)}</h3><p>${esc(b.texto)}</p></div>`).join("")}
  </div>
</section>`,
    recomendados: () => `
<section class="recs-sec">
  <div class="sec-label">${esc(textos.recomendadosEtiqueta)}</div>
  <div class="sec-title">${esc(textos.recomendadosTitulo)}</div>
  <div class="recs-grid" id="recomendados"></div>
</section>`,
    top: () => `
<section class="top-sec">
  <div class="sec-label">${esc(textos.topEtiqueta)}</div>
  <div class="sec-title">${esc(textos.topTitulo)}</div>
  <div class="top-grid" id="top"></div>
</section>`,
    duelo: () => `
<section class="duelo-sec">
  <div class="sec-label">${esc(textos.dueloEtiqueta)}</div>
  <div class="sec-title">${esc(textos.dueloTitulo)}</div>
  <div class="duelo-arena" id="duelo"></div>
  <p class="duelo-info">${esc(textos.dueloInfo)}</p>
</section>`,
    testimonios: () =>
      t.testimonios.length
        ? `
<section class="testimonios-sec">
  <div class="sec-centro"><div class="sec-label">${esc(textos.testimoniosEtiqueta)}</div><div class="sec-title">${esc(textos.testimoniosTitulo)}</div></div>
  <div class="testimonios-grid">${t.testimonios.map((x) => `<div class="testimonio"><p>${esc(x.texto)}</p><strong>— ${esc(x.nombre)}</strong></div>`).join("")}</div>
</section>`
        : "",
    horarios: () =>
      negocio.horarios.length
        ? `
<section class="horarios-sec">
  <div class="sec-label">${esc(textos.horariosEtiqueta)}</div>
  <div class="sec-title">${esc(textos.horariosTitulo)}</div>
  <ul class="horarios-lista">${negocio.horarios.map((h) => `<li>🕒 ${esc(h)}</li>`).join("")}</ul>
</section>`
        : "",
  };

  const cuerpo = t.secciones
    .map((id) => {
      if (id.startsWith("custom:")) {
        const s = t.personalizado.secciones.find((x) => x.id === id.slice(7));
        return s ? `<section class="seccion-personalizada" id="custom-${esc(s.id)}">\n${s.html}\n</section>` : "";
      }
      return secciones[id]?.() ?? "";
    })
    .join("\n");

  // ----- Footer -----
  const contacto: string[] = [];
  if (datos.whatsapp)
    contacto.push(`<li><a href="https://wa.me/${datos.whatsapp}" target="_blank" rel="noopener">WhatsApp: +${datos.whatsapp.replace(/^57/, "57 ")}</a></li>`);
  if (negocio.instagram)
    contacto.push(`<li><a href="${esc(urlRed(negocio.instagram, "https://instagram.com/"))}" target="_blank" rel="noopener">Instagram: @${esc(negocio.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, ""))}</a></li>`);
  if (negocio.facebook)
    contacto.push(
      /^https?:\/\//.test(negocio.facebook)
        ? `<li><a href="${esc(negocio.facebook)}" target="_blank" rel="noopener">Facebook</a></li>`
        : `<li>Facebook: ${esc(negocio.facebook)}</li>`,
    );
  if (negocio.tiktok)
    contacto.push(`<li><a href="${esc(urlRed(negocio.tiktok, "https://www.tiktok.com/@"))}" target="_blank" rel="noopener">TikTok: @${esc(negocio.tiktok.replace(/^@/, ""))}</a></li>`);
  if (negocio.ciudad) contacto.push(`<li>📍 ${esc(negocio.ciudad)}</li>`);

  const categorias = [...new Set(t.productos.map((p) => p.categoria))];

  const footer = `
<footer>
  <div class="footer-grid">
    <div class="footer-marca"><h3>${esc(negocio.nombre)}</h3><p>${esc(textos.footerTexto)}</p></div>
    <div class="footer-col"><h4>Contacto</h4><ul>${contacto.join("")}</ul></div>
    <div class="footer-col"><h4>Pagos</h4><ul>${t.pagos.metodos.map((m) => `<li>${esc(m.nombre)}</li>`).join("")}</ul></div>
    <div class="footer-col"><h4>Categorías</h4><ul>${categorias.map((cat) => `<li>${esc(cat)}</li>`).join("")}</ul></div>
  </div>
  <div class="footer-bottom">
    <span>© ${new Date().getFullYear()} ${esc(negocio.nombre)} — Todos los derechos reservados</span>
    <span>${esc(textos.footerFrase)}</span>
  </div>
</footer>`;

  const fuentes = [enlaceFuente(tema.fuentes.titulos, false)];
  if (tema.fuentes.cuerpo !== tema.fuentes.titulos) fuentes.push(enlaceFuente(tema.fuentes.cuerpo, true));
  else fuentes[0] = enlaceFuente(tema.fuentes.titulos, true);

  const scriptErrores = op.preview
    ? `<script>window.addEventListener("error",function(e){try{parent.postMessage({tipo:"error-tienda",mensaje:String(e.message)+(e.lineno?" (línea "+e.lineno+")":"")},"*")}catch(_){}});</script>`
    : "";

  const css = `/* ===== ${negocio.nombre.toUpperCase()} — ESTILOS =====
   Colores, fuentes y formas de la tienda: cambia las variables de :root
   y se actualiza todo el sitio.
   Generado con Harvys — Profesor Harvey Sanabria. */
${vars}
${CSS_TIENDA}
/* ===== CSS PERSONALIZADO ===== */
${t.personalizado.css || ""}
`;

  const js = `/* ===== ${negocio.nombre.toUpperCase()} — DATOS DE LA TIENDA =====
   Aquí están los productos (precio en COP como número entero), los medios de pago
   y el WhatsApp. Puedes editarlos directamente.
   Generado con Harvys — Profesor Harvey Sanabria. */
window.TIENDA_DATOS = ${JSON.stringify(datos, null, 2)};

/* ===== FUNCIONAMIENTO DE LA TIENDA ===== */
${SCRIPT_TIENDA}`;

  const html = `<!DOCTYPE html>
<!-- Tienda generada con Harvys, asistente de e-commerce creado por el Profesor Harvey Sanabria -->
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(negocio.nombre)}${negocio.eslogan ? " — " + esc(negocio.eslogan) : ""}</title>
<meta name="description" content="${esc(negocio.descripcion)}">
<meta name="generator" content="Harvys — asistente de e-commerce del Profesor Harvey Sanabria">
${scriptErrores}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fuentes.join("\n")}
${separado ? `<link rel="stylesheet" href="styles.css">` : `<style>\n${css}</style>`}
</head>
<body class="anim-${tema.animaciones} tarj-${tema.tarjetas} modo-${tema.modo}">

<!-- MODAL PAGO -->
<div class="modal-overlay" id="modal-pago" onclick="modalClickFuera(event)">
  <div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-head"><h3>Confirmar pago</h3><button class="modal-cerrar" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    <div class="modal-body">
      <div class="modal-total"><span class="tl">Total a pagar</span><span class="tm" id="modal-total-monto">$0</span></div>
      <div class="pago-metodos" id="pago-metodos"></div>
      <div class="pago-datos" id="pago-datos">
        <div class="pd-label">Transferir a este número</div>
        <div class="pd-numero" id="pd-numero"></div>
        <div class="pd-nombre" id="pd-nombre"></div>
        <button class="btn-copiar" onclick="copiarNumero()">📋 Copiar número</button>
      </div>
      <div class="pasos">
        <div class="paso"><div class="paso-num">1</div><div class="paso-txt" id="paso-1"></div></div>
        <div class="paso"><div class="paso-num">2</div><div class="paso-txt">Toca <strong>"Confirmar y enviar"</strong> — se abre WhatsApp con tu pedido</div></div>
        <div class="paso"><div class="paso-num">3</div><div class="paso-txt" id="paso-3"></div></div>
      </div>
    </div>
    <div class="modal-foot">
      <a href="#" target="_blank" rel="noopener" class="btn-wsp" onclick="return prepararWsp(this)">✅ Confirmar y enviar por WhatsApp</a>
      <button class="btn-seguir" onclick="cerrarModal()">← Seguir comprando</button>
    </div>
  </div>
</div>

<div class="overlay" id="overlay" onclick="cerrarCarrito()"></div>

<!-- VISOR DE FOTOS -->
<div class="visor" id="visor" role="dialog" aria-modal="true" aria-label="Foto del producto">
  <figure class="visor-caja">
    <button class="visor-cerrar" aria-label="Cerrar">✕</button>
    <div class="visor-foto" id="visor-foto"><img id="visor-img" alt=""></div>
    <figcaption><strong id="visor-nombre"></strong><span id="visor-precio"></span></figcaption>
    <div class="visor-ayuda">Toca o haz clic en la foto para ampliarla más</div>
  </figure>
</div>

<button class="carrito-fab" onclick="toggleCarrito()" id="fab" aria-label="Abrir carrito">🛒<span class="carrito-badge" id="badge">0</span></button>

<div class="carrito-panel" id="panel-carrito">
  <div class="panel-header"><h3>${esc(textos.carritoTitulo)}</h3><button class="btn-cerrar" onclick="cerrarCarrito()" aria-label="Cerrar carrito">✕</button></div>
  <ul id="lista-carrito"></ul>
  <div class="panel-footer">
    <div class="total-row"><span class="total-lbl">Total</span><span class="total-monto" id="total">$0</span></div>
    <div class="panel-btns"><button class="btn-vaciar" onclick="vaciarCarrito()">Vaciar</button><button class="btn-pagar" onclick="pagar()">${esc(textos.botonPagar)}</button></div>
  </div>
</div>
${hero}
${cuerpo}
${footer}

${
  op.preview
    ? ""
    : `<!-- Copia del proyecto para volver a abrirlo en Harvys (botón "Abrir"). No la borres. -->
<script type="application/json" id="harvys-proyecto">${jsonSeguro(t)}</script>`
}
${
  separado
    ? `<script src="script.js"></script>`
    : `<script>\nwindow.TIENDA_DATOS = ${jsonSeguro(datos)};\n</script>\n<script>\n${SCRIPT_TIENDA}\n</script>`
}
</body>
</html>`;

  return { html, css, js };
}

export { slug };
