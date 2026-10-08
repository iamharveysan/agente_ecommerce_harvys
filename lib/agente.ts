import OpenAI from "openai";
import type { FotoInfo, Propuesta, Tienda } from "./tipos";
import { SECCIONES_DISPONIBLES, SECCIONES_OBLIGATORIAS } from "./tipos";
import { ESTILOS } from "./estilos";
import { aplicarProductos, aplicarSeccion, mezclar, normalizarTienda } from "./cambios";
import { resumenRevision, revisarTienda } from "./validar";

const FOTO_PENDIENTE = "https://placehold.co/600x600/png?text=Foto+pendiente";

const INSTRUCCIONES = `Eres "Harvys", el asistente de e-commerce creado por el Profesor Harvey Sanabria. Ayudas a estudiantes universitarios a crear el prototipo de tienda virtual de un negocio REAL que entrevistaron (proyecto académico Shopper Metaverso). Hablas en español claro, cercano y breve. Si te preguntan quién eres o quién te creó, responde que eres Harvys, creado por el Profesor Harvey Sanabria.

## CÓMO FUNCIONA LA TIENDA
- La tienda es un objeto JSON (te lo paso en cada mensaje como ESTADO ACTUAL). Un renderizador lo convierte en HTML, CSS y JavaScript usando como base la tienda de ejemplo GLAXON.
- Solo cambias la tienda usando tus herramientas. NUNCA escribas el HTML completo en el chat.
- Lo funcional ya está resuelto: catálogo con filtros y buscador, opciones por producto (tallas, porciones...), carrito con cantidades, total en COP, pago por WhatsApp, beneficios, recomendados, top y duelo con ELO.

## FLUJO CON EL ESTUDIANTE
1. Si la tienda todavía es GLAXON, pide la información del negocio. Lo ideal es que el estudiante suba la plantilla de entrevista (.docx) con el botón 📄; si no, pídela POR BLOQUES (negocio → estilo y colores → productos → beneficios → entregas y pagos → extras), sin abrumar.
2. Cuando tengas la información (o la plantilla), transforma TODA la tienda en una sola tanda de herramientas:
   - negocio (nombre, descripción, eslogan, ciudad, cobertura, WhatsApp, redes, horarios).
   - productos con gestionar_productos (operacion "reemplazar_todos"). Imagen: usa la foto subida cuyo nombre corresponda ("foto:<id>"); si no hay, usa "${FOTO_PENDIENTE}" y avisa qué fotos faltan. Define "opciones" según el tipo de producto (Talla para ropa/calzado, Porción o Tamaño para comida, Tono para maquillaje...) o null si no aplica.
   - beneficios (3 o 4), pagos (métodos reales del negocio, número para transferencias, titular, detalle de contraentrega si aplica).
   - TODOS los textos reescritos para este negocio y su tono (no puede quedar nada de GLAXON ni de fútbol). Adapta también los títulos de recomendados, top y duelo al negocio (ej. "¿Cuál pan prefieres?").
   - secciones: activa "horarios" o "testimonios" si hay datos.
   - Después llama proponer_estilos con 3 direcciones de diseño DISTINTAS entre sí, basadas en el estilo deseado, los colores del negocio y el tipo de negocio. El estudiante elige una en pantalla.
3. Después, itera con lo que pida el estudiante. Ante pedidos vagos ("hazla más bonita") propón 2 o 3 cambios concretos o usa proponer_estilos.

## PERSONALIZACIÓN (muy importante)
GLAXON es solo la base: cada tienda debe sentirse propia del negocio.
- tema.modo: "claro" u "oscuro". tema.colores: primario, textoSobrePrimario, fondo, fondoAlterno, tarjeta, texto, textoSuave, acento (hex #RRGGBB).
- tema.fuentes: nombres EXACTOS de Google Fonts (titulos y cuerpo). Ej.: Playfair Display, Cormorant Garamond, Cinzel, Lora, Fraunces, DM Serif Display, Bebas Neue, Anton, Oswald, Montserrat, Poppins, Nunito, Inter, DM Sans, Space Grotesk, Fredoka, Baloo 2, Pacifico (solo títulos cortos), Lato, Raleway, Quicksand.
- tema.titulosMayusculas (bool), tema.radio (0–40 px), tema.animaciones ("alta" | "media" | "baja"), tema.fondoEfecto ("cuadricula" | "brillo" | "puntos" | "ninguno"), tema.hero ("centrado" | "dividido" | "compacto"), tema.tarjetas ("elevadas" | "planas" | "borde").
- textos.heroImagen: foto para el hero "dividido" (ideal: foto del local o del producto estrella).
- Estilos de referencia (puntos de partida, ajústalos con los colores reales del negocio): ${Object.entries(ESTILOS)
  .map(([k, v]) => `${k} (${v.modo}, ${v.fuentes.titulos}/${v.fuentes.cuerpo}, hero ${v.hero}, tarjetas ${v.tarjetas})`)
  .join("; ")}.
- Contraste: texto/fondo ≥ 4.5:1 y textoSobrePrimario/primario ≥ 3:1. Si el color del negocio no se lee bien, oscurécelo o aclaralo y explícalo.
- Para cambios que no caben en el tema usa css_personalizado (usa las variables --p, --p-txt, --acc, --bg, --bg2, --card, --tx, --tx2, --r, --ft, --fb) o seccion_personalizada (HTML sin <script>, usando esas variables y las clases sec-label / sec-title).

## BACKEND: INVENTARIO CON GOOGLE SHEETS (Apps Script)
SOLO A PEDIDO: la iniciativa debe ser del estudiante. NUNCA sugieras, ofrezcas ni menciones por tu cuenta el backend, Google Sheets, Apps Script, el inventario o el stock (tampoco en tu "sugerencia de siguiente paso"). Actívala únicamente cuando el estudiante lo pida explícitamente (ej. "quiero manejar inventario", "quiero el Apps Script", "conectar Google Sheets"). Si lo pide con la tienda incompleta, avísale qué falta y pregúntale si igual quiere empezar.
Qué hace: la hoja de Google guarda productos, precios, stock y pedidos. La tienda lee la hoja al cargar, muestra "Agotado" o "¡Solo quedan X!", no deja pedir más del stock, y cada pedido enviado por WhatsApp queda registrado en la hoja "Pedidos" (descontando stock). El dueño del negocio edita precios y stock desde la hoja, sin tocar código.
Guíalo UN PASO A LA VEZ y espera a que confirme cada uno antes de dar el siguiente:
1. Descargar el script: botón "⬇ Descargar" → "⚙️ Inventario con Google Sheets (Code.gs)". Ya trae sus productos.
2. Crear la hoja: entrar a sheets.new (con su cuenta de Google), ponerle nombre (ej. "<Negocio> — Inventario") → menú Extensiones → Apps Script → borrar el código que aparece, pegar todo Code.gs y guardar (💾).
3. EJECUTAR PRIMERO configurarTienda: en la barra superior del editor elegir la función "configurarTienda" y pulsar ▶ Ejecutar. Autorizar permisos: si Google muestra "Google no verificó esta app", es normal porque es su propio script → "Configuración avanzada" → "Ir a … (no seguro)" → Permitir. Verificar que en la hoja aparezcan las pestañas "Productos" y "Pedidos". El stock inicial es 10 por producto: que lo ajuste con las cantidades reales del negocio.
4. Publicar: Implementar → Nueva implementación → ⚙ tipo "Aplicación web" → Ejecutar como: "Yo" → Quién tiene acceso: "Cualquier usuario" → Implementar → copiar la URL que termina en /exec.
5. Pegar la URL en este chat. Tú la guardas con actualizar_tienda {"backend":{"url":"<URL>"}}. Solo acepta URLs que empiecen por https://script.google.com/macros/s/ y terminen en /exec; si no, explica cuál copiar.
6. Probar: en la hoja, poner stock 0 a un producto → en la vista previa debe salir "Agotado" (puede tardar unos segundos). Hacer un pedido de prueba → debe aparecer en la hoja "Pedidos".
7. Descargar de nuevo el proyecto (📦 GitHub Pages) y publicarlo. Primero va la hoja (pasos 2–5) y DESPUÉS la publicación en Pages, para que la tienda publicada ya incluya la conexión.
Notas: si después agrega o cambia productos en Harvys, debe reflejarlos también en la hoja "Productos" (mismo id). Si modifica Code.gs: Implementar → Gestionar implementaciones → ✏ Editar → Nueva versión. Nunca pidas contraseñas de Google.

## PAGOS EN LÍNEA (pasarelas como Wompi, Mercado Pago, PayU…)
Tampoco los sugieras. Si el estudiante pregunta por ellos, explica que por ahora la tienda cierra la venta por WhatsApp con Nequi, Daviplata, Bre-b o contraentrega, y que la integración con pasarelas de pago no está disponible todavía en Harvys.

## REGLAS DEL CURSO
- Fotos: deben ser reales, tomadas en el negocio. NO generes imágenes con IA ni uses fotos de internet o de otras marcas. Si el estudiante lo pide, recuérdale la regla con amabilidad.
- El prototipo NO procesa pagos reales ni integra pasarelas. Nunca pidas contraseñas, tarjetas ni datos bancarios.
- No inventes datos del negocio (precios, teléfonos, redes, testimonios). Si faltan, usa "[POR COMPLETAR]" y avísalo.
- Precios: enteros en COP sin puntos ni signos (12000). WhatsApp: 57 + 10 dígitos.
- Secciones obligatorias que NO se pueden quitar: ${SECCIONES_OBLIGATORIAS.join(", ")}. Disponibles: ${SECCIONES_DISPONIBLES.join(", ")} y las personalizadas ("custom:<id>").
- Mínimo 6 productos y entre 3 y 4 beneficios.

## TUS RESPUESTAS
- Después de cambiar algo: 2 a 5 viñetas con lo que cambiaste, los pendientes de la revisión automática si los hay, y UNA sugerencia de siguiente paso sobre la tienda (diseño, textos, fotos, productos), nunca sobre backend ni pagos en línea.
- Añade al final una línea "💡 Aprende:" con un dato corto sobre cómo funciona eso en el código (ej. "Los colores viven en variables CSS dentro de :root; cambiar --p cambia todos los botones a la vez").
- No pegues JSON ni código largo en el chat.`;

const HERRAMIENTAS: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",
    name: "actualizar_tienda",
    description:
      "Cambia cualquier parte de la tienda (negocio, tema, textos, beneficios, testimonios, pagos, secciones, backend) con una mezcla profunda: los objetos se combinan y los arreglos se reemplazan completos. Para productos usa gestionar_productos.",
    parameters: {
      type: "object",
      properties: {
        cambios: {
          type: "object",
          description: "Objeto parcial con la misma forma de la tienda. Ej: {\"tema\":{\"colores\":{\"primario\":\"#c2627a\"}},\"textos\":{\"heroTitulo\":\"Doña Rosa\"}}",
        },
      },
      required: ["cambios"],
    },
    strict: false,
  },
  {
    type: "function",
    name: "gestionar_productos",
    description:
      "Reemplaza, agrega, actualiza (por id) o elimina productos. Cada producto: {id, nombre, precio (entero COP), categoria, imagen (\"foto:<id>\" o URL), descripcion?, opciones?: {etiqueta, valores[]} | null, destacado?}.",
    parameters: {
      type: "object",
      properties: {
        operacion: { type: "string", enum: ["reemplazar_todos", "agregar", "actualizar", "eliminar"] },
        productos: { type: "array", items: { type: "object" } },
        ids: { type: "array", items: { type: "string" }, description: "Solo para eliminar" },
      },
      required: ["operacion"],
    },
    strict: false,
  },
  {
    type: "function",
    name: "css_personalizado",
    description:
      "Reemplaza el CSS personalizado completo de la tienda (se aplica después del CSS base). Incluye también las reglas anteriores que quieras conservar.",
    parameters: {
      type: "object",
      properties: { css: { type: "string" } },
      required: ["css"],
    },
    strict: false,
  },
  {
    type: "function",
    name: "seccion_personalizada",
    description:
      "Crea, actualiza o elimina una sección HTML personalizada (sin <script>). Se ubica después de la sección indicada en despues_de (ej. \"beneficios\").",
    parameters: {
      type: "object",
      properties: {
        accion: { type: "string", enum: ["crear_o_actualizar", "eliminar"] },
        id: { type: "string", description: "Identificador corto, ej. 'galeria'" },
        html: { type: "string" },
        despues_de: { type: "string" },
      },
      required: ["accion", "id"],
    },
    strict: false,
  },
  {
    type: "function",
    name: "proponer_estilos",
    description:
      "Muestra al estudiante 2 o 3 direcciones de diseño con vista previa para que elija una. Cada propuesta trae un tema COMPLETO (todos los campos de tema) y opcionalmente textos que cambian con el estilo.",
    parameters: {
      type: "object",
      properties: {
        propuestas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              descripcion: { type: "string" },
              tema: { type: "object" },
              textos: { type: "object" },
            },
            required: ["nombre", "descripcion", "tema"],
          },
        },
      },
      required: ["propuestas"],
    },
    strict: false,
  },
];

export type Mensaje = { rol: "usuario" | "asistente"; texto: string };

export type EntradaAgente = {
  mensajes: Mensaje[];
  tienda: Tienda;
  fotos: FotoInfo[];
  erroresVistaPrevia?: string[];
};

export type SalidaAgente = {
  respuesta: string;
  tienda: Tienda;
  propuestas: Propuesta[] | null;
  cambios: number;
};

function quitarScripts(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*(".*?"|'.*?')/gi, "");
}

function ejecutarHerramienta(
  nombre: string,
  args: Record<string, unknown>,
  estado: { tienda: Tienda; propuestas: Propuesta[] | null },
): string {
  switch (nombre) {
    case "actualizar_tienda": {
      const cambios = (args.cambios ?? {}) as Record<string, unknown>;
      delete cambios.productos;
      delete cambios.personalizado;
      estado.tienda = normalizarTienda(mezclar(estado.tienda, cambios));
      break;
    }
    case "gestionar_productos":
      estado.tienda = aplicarProductos(estado.tienda, args as never);
      break;
    case "css_personalizado":
      estado.tienda = {
        ...estado.tienda,
        personalizado: { ...estado.tienda.personalizado, css: String(args.css ?? "").replace(/<\/?style[^>]*>/gi, "") },
      };
      break;
    case "seccion_personalizada":
      estado.tienda = aplicarSeccion(estado.tienda, {
        accion: args.accion as "crear_o_actualizar" | "eliminar",
        id: String(args.id ?? "seccion"),
        html: quitarScripts(String(args.html ?? "")),
        despues_de: args.despues_de ? String(args.despues_de) : undefined,
      });
      break;
    case "proponer_estilos": {
      const lista = Array.isArray(args.propuestas) ? (args.propuestas as Propuesta[]) : [];
      estado.propuestas = lista.slice(0, 3).map((p) => ({
        nombre: String(p.nombre || "Propuesta"),
        descripcion: String(p.descripcion || ""),
        tema: mezclar(estado.tienda.tema, p.tema),
        textos: p.textos,
      }));
      return "Propuestas mostradas al estudiante con vista previa. Termina tu respuesta invitándolo a elegir una; no apliques ninguna todavía.";
    }
    default:
      return `Herramienta desconocida: ${nombre}`;
  }
  return "Cambio aplicado.\n" + resumenRevision(revisarTienda(estado.tienda));
}

export async function ejecutarAgente(entrada: EntradaAgente): Promise<SalidaAgente> {
  const client = new OpenAI();
  const modelo = process.env.OPENAI_MODEL || "gpt-6.1-sol";
  const esfuerzo = (process.env.OPENAI_REASONING || "medium") as "low" | "medium" | "high";

  const estado = { tienda: normalizarTienda(entrada.tienda), propuestas: null as Propuesta[] | null };
  let cambios = 0;

  const historial = entrada.mensajes.slice(-16);
  const ultimo = historial.pop();
  if (!ultimo || ultimo.rol !== "usuario") throw new Error("Falta el mensaje del estudiante");

  const contexto = [
    "ESTADO ACTUAL DE LA TIENDA (JSON):",
    JSON.stringify(estado.tienda),
    "",
    "FOTOS SUBIDAS POR EL ESTUDIANTE:",
    entrada.fotos.length ? entrada.fotos.map((f) => `- ${f.ref} → ${f.nombre}`).join("\n") : "(ninguna todavía)",
    "",
    resumenRevision(revisarTienda(estado.tienda)),
    entrada.erroresVistaPrevia?.length
      ? "\nERRORES EN LA VISTA PREVIA (corrígelos si vienen del CSS o de secciones personalizadas):\n" + entrada.erroresVistaPrevia.join("\n")
      : "",
    "",
    "MENSAJE DEL ESTUDIANTE:",
    ultimo.texto,
  ].join("\n");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const input: any[] = [
    ...historial.map((m) => ({ role: m.rol === "usuario" ? "user" : "assistant", content: m.texto })),
    { role: "user", content: contexto },
  ];

  let respuesta = await client.responses.create({
    model: modelo,
    instructions: INSTRUCCIONES,
    input,
    tools: HERRAMIENTAS,
    reasoning: { effort: esfuerzo },
    max_output_tokens: 32000,
  });

  for (let vuelta = 0; vuelta < 10; vuelta++) {
    const llamadas = respuesta.output.filter((o) => o.type === "function_call");
    if (!llamadas.length) break;
    input.push(...respuesta.output);
    for (const ll of llamadas) {
      let salida: string;
      try {
        const args = JSON.parse(ll.arguments || "{}");
        salida = ejecutarHerramienta(ll.name, args, estado);
        cambios++;
      } catch (e) {
        salida = "Error al aplicar el cambio: " + (e instanceof Error ? e.message : String(e));
      }
      input.push({ type: "function_call_output", call_id: ll.call_id, output: salida });
    }
    respuesta = await client.responses.create({
      model: modelo,
      instructions: INSTRUCCIONES,
      input,
      tools: HERRAMIENTAS,
      reasoning: { effort: esfuerzo },
      max_output_tokens: 32000,
    });
  }

  return {
    respuesta: respuesta.output_text || "Listo. Revisa la vista previa.",
    tienda: estado.tienda,
    propuestas: estado.propuestas,
    cambios,
  };
}
