import JSZip from "jszip";
import type { Tienda } from "./tipos";
import type { Foto } from "./fotos";
import { renderArchivos, renderTienda, slug } from "./render";
import { generarAppsScript } from "./appscript";

export type FormatoDescarga = "pages" | "unico" | "index.html" | "styles.css" | "script.js" | "Code.gs";

const README = (nombre: string) => `# ${nombre}

Prototipo de tienda virtual creado para el proyecto Shopper Metaverso,
generado con **Harvys**, el asistente de e-commerce del Profesor Harvey Sanabria.

## Archivos

| Archivo | Qué contiene |
|---|---|
| \`index.html\` | La estructura de la página (portada, catálogo, carrito, pago, footer). |
| \`styles.css\` | El diseño: colores y fuentes en las variables de \`:root\`, al inicio del archivo. |
| \`script.js\` | Los datos de la tienda (productos, precios, pagos, WhatsApp) al inicio y el funcionamiento (filtros, carrito, WhatsApp, top, duelo). |
| \`img/\` | Las fotos de los productos. |

## Verla en tu computador

Abre \`index.html\` con doble clic.

## Publicarla en GitHub Pages

1. Crea un repositorio nuevo en GitHub (público).
2. Sube **todos** los archivos de esta carpeta (incluida la carpeta \`img/\`) a la raíz del repositorio.
   - Desde la web: *Add file → Upload files* y arrastra todo.
   - Desde la terminal: \`git init\`, \`git add .\`, \`git commit -m "Mi tienda"\`, \`git branch -M main\`,
     \`git remote add origin <url-del-repo>\`, \`git push -u origin main\`.
3. En el repositorio ve a *Settings → Pages*.
4. En *Source* elige **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda.
5. Espera 1–2 minutos: tu tienda queda en \`https://<tu-usuario>.github.io/<nombre-del-repo>/\`.

> El prototipo no procesa pagos reales; los pedidos llegan por WhatsApp.
`;

// Convierte las fotos subidas ("foto:<id>") en archivos dentro de img/.
function preparadorImagenes(fotos: Map<string, Foto>) {
  const archivos = new Map<string, string>(); // ruta -> base64
  const usadas = new Map<string, string>();
  const resolver = (ref: string): string => {
    if (!ref.startsWith("foto:")) return ref;
    const foto = fotos.get(ref.slice(5));
    // La foto ya no está en este navegador: mejor un aviso visible que una imagen rota
    if (!foto) return "https://placehold.co/600x600/png?text=Foto+pendiente";
    let ruta = usadas.get(ref);
    if (!ruta) {
      const ext = foto.dataUrl.startsWith("data:image/png") ? "png" : "jpg";
      ruta = `img/${slug(foto.nombre.replace(/\.[^.]+$/, ""))}-${foto.id}.${ext}`;
      usadas.set(ref, ruta);
      archivos.set(ruta, foto.dataUrl.split(",")[1]);
    }
    return ruta;
  };
  return { resolver, archivos };
}

export async function generarDescarga(
  tienda: Tienda,
  fotos: Map<string, Foto>,
  formato: FormatoDescarga,
): Promise<{ blob: Blob; nombre: string }> {
  const base = slug(tienda.negocio.nombre);
  const { resolver, archivos } = preparadorImagenes(fotos);

  if (formato === "Code.gs") {
    const codigo = generarAppsScript(tienda, resolver);
    return { blob: new Blob([codigo], { type: "text/javascript;charset=utf-8" }), nombre: "Code.gs" };
  }

  if (formato === "index.html" || formato === "styles.css" || formato === "script.js") {
    const partes = renderArchivos(tienda, { resolverImagen: resolver });
    const contenido = formato === "index.html" ? partes.html : formato === "styles.css" ? partes.css : partes.js;
    const tipo = formato === "index.html" ? "text/html" : formato === "styles.css" ? "text/css" : "text/javascript";
    return { blob: new Blob([contenido], { type: tipo + ";charset=utf-8" }), nombre: formato };
  }

  const zip = new JSZip();
  if (formato === "pages") {
    const partes = renderArchivos(tienda, { resolverImagen: resolver });
    zip.file("index.html", partes.html);
    zip.file("styles.css", partes.css);
    zip.file("script.js", partes.js);
    zip.file("README.md", README(tienda.negocio.nombre));
    zip.file(".nojekyll", "");
  } else {
    zip.file("index.html", renderTienda(tienda, { resolverImagen: resolver }));
    zip.file("README.md", README(tienda.negocio.nombre).replace(/\| `styles\.css`.*\n\| `script\.js`.*\n/, ""));
  }
  for (const [ruta, b64] of archivos) zip.file(ruta, b64, { base64: true });

  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, nombre: `${base}${formato === "pages" ? "" : "-todo-en-uno"}.zip` };
}
