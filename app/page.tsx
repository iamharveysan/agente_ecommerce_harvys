"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Propuesta, Tienda } from "@/lib/tipos";
import { TIENDA_BASE } from "@/lib/glaxon";
import { renderTienda } from "@/lib/render";
import { mezclar, normalizarTienda } from "@/lib/cambios";
import { revisarTienda } from "@/lib/validar";
import { borrarFoto, borrarTodasLasFotos, guardarFoto, listarFotos, prepararFoto, type Foto } from "@/lib/fotos";
import { generarDescarga, type FormatoDescarga } from "@/lib/exportar";
import { Icono } from "./Icono";
import { importarTienda } from "@/lib/importar";

type Mensaje = { rol: "usuario" | "asistente"; texto: string; visible?: string; propuestas?: Propuesta[] };

const CLAVE_ESTADO = "ce_estado_v1";
const CLAVE_CODIGO = "ce_codigo";
const FOTO_PENDIENTE = "https://placehold.co/600x600/png?text=Foto+pendiente";

const BIENVENIDA: Mensaje = {
  rol: "asistente",
  texto:
    "¡Hola! Soy **Harvys**, tu asistente para construir la tienda virtual del negocio que entrevistaste.\n\nA la derecha ves la tienda de ejemplo **GLAXON**: es la base, pero tu tienda va a tener su propia personalidad.\n\n**Para empezar:**\n- Sube tu **plantilla de entrevista** (.docx) con el botón de abajo, o cuéntame del negocio.\n- Sube las **fotos reales** de los productos.\n\nCon eso transformo la tienda y te propongo 3 estilos para que elijas.\n\n**¿Ya tenías una tienda?** Pulsa **Abrir** (arriba) y sube el .zip o la carpeta que descargaste para seguir trabajando.",
};

const SUGERENCIAS = [
  "Proponme 3 estilos distintos para mi tienda",
  "Revisa mi tienda y dime qué le falta",
  "Agrega una sección de testimonios",
  "Haz la tienda más elegante",
];

function leerLocal<T>(clave: string, defecto: T): T {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : defecto;
  } catch {
    return defecto;
  }
}
function escribirLocal(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

// Formato mínimo para las respuestas del asistente: **negrita** y viñetas.
function TextoFormateado({ texto }: { texto: string }) {
  const negrita = (linea: string, k: number): ReactNode[] =>
    linea.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
      parte.startsWith("**") && parte.endsWith("**") ? <strong key={`${k}-${i}`}>{parte.slice(2, -2)}</strong> : parte,
    );
  const bloques: ReactNode[] = [];
  let lista: ReactNode[] = [];
  const cerrarLista = () => {
    if (lista.length) bloques.push(<ul key={`ul-${bloques.length}`}>{lista}</ul>);
    lista = [];
  };
  texto.split("\n").forEach((linea, i) => {
    const m = linea.match(/^\s*(?:[-•*]|\d+\.)\s+(.*)$/);
    if (m) lista.push(<li key={i}>{negrita(m[1], i)}</li>);
    else {
      cerrarLista();
      if (linea.trim()) bloques.push(<p key={i}>{negrita(linea.replace(/^#+\s*/, ""), i)}</p>);
    }
  });
  cerrarLista();
  return <>{bloques}</>;
}

function MiniVista({ html }: { html: string }) {
  return (
    <div className="mini-vista">
      <iframe srcDoc={html} sandbox="allow-scripts" title="Vista previa del estilo" tabIndex={-1} />
    </div>
  );
}

export default function Pagina() {
  const [montado, setMontado] = useState(false);
  const [tienda, setTienda] = useState<Tienda>(TIENDA_BASE);
  const [historial, setHistorial] = useState<Tienda[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([BIENVENIDA]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState("");
  const [dispositivo, setDispositivo] = useState<"escritorio" | "movil">("escritorio");
  const [vistaMovil, setVistaMovil] = useState<"chat" | "tienda">("chat");
  const [verRevision, setVerRevision] = useState(false);
  const [verFotos, setVerFotos] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [codigo, setCodigo] = useState("");
  const [pedirCodigo, setPedirCodigo] = useState(false);
  const [menuDescarga, setMenuDescarga] = useState(false);
  const [menuAbrir, setMenuAbrir] = useState(false);
  const inputAbrir = useRef<HTMLInputElement>(null);
  const inputCarpeta = useRef<HTMLInputElement>(null);

  const finChat = useRef<HTMLDivElement>(null);
  const inputPlantilla = useRef<HTMLInputElement>(null);
  const inputFotos = useRef<HTMLInputElement>(null);

  // Cargar el proyecto guardado en este navegador
  useEffect(() => {
    const guardado = leerLocal<{ tienda: Tienda; historial: Tienda[]; mensajes: Mensaje[] } | null>(CLAVE_ESTADO, null);
    if (guardado?.tienda) {
      setTienda(normalizarTienda(guardado.tienda));
      setHistorial(guardado.historial ?? []);
      const previos = guardado.mensajes?.length ? guardado.mensajes : [BIENVENIDA];
      // Mantiene actualizado el saludo inicial en proyectos guardados con una versión anterior
      if (previos[0].rol === "asistente" && previos[0].texto.includes("Para empezar")) previos[0] = BIENVENIDA;
      setMensajes(previos);
    }
    setCodigo(leerLocal(CLAVE_CODIGO, ""));
    listarFotos().then(setFotos);
    setMontado(true);
  }, []);

  useEffect(() => {
    if (montado) escribirLocal(CLAVE_ESTADO, { tienda, historial: historial.slice(-20), mensajes: mensajes.slice(-60) });
  }, [tienda, historial, mensajes, montado]);

  useEffect(() => {
    finChat.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  // Errores de JavaScript que reporta la vista previa
  useEffect(() => {
    const oir = (e: MessageEvent) => {
      if (e.data?.tipo === "error-tienda")
        setErrores((prev) => (prev.includes(e.data.mensaje) ? prev : [...prev, String(e.data.mensaje)].slice(-5)));
    };
    window.addEventListener("message", oir);
    return () => window.removeEventListener("message", oir);
  }, []);

  const mapaFotos = useMemo(() => new Map(fotos.map((f) => [f.id, f])), [fotos]);
  const resolverImagen = useCallback(
    (ref: string) => (ref.startsWith("foto:") ? mapaFotos.get(ref.slice(5))?.dataUrl || FOTO_PENDIENTE : ref),
    [mapaFotos],
  );

  const html = useMemo(() => renderTienda(tienda, { resolverImagen, preview: true }), [tienda, resolverImagen]);
  useEffect(() => setErrores([]), [html]);

  const revision = useMemo(() => revisarTienda(tienda), [tienda]);
  const requisitos = revision.filter((r) => r.nivel === "requisito");
  const cumplidos = requisitos.filter((r) => r.ok).length;

  const cambiarTienda = (nueva: Tienda) => {
    setHistorial((h) => [...h, tienda].slice(-20));
    setTienda(nueva);
  };

  const deshacer = () => {
    if (!historial.length) return;
    setTienda(historial[historial.length - 1]);
    setHistorial((h) => h.slice(0, -1));
  };

  const cabeceras = (): Record<string, string> => (codigo ? { "x-codigo-acceso": codigo } : {});

  async function enviar(texto: string, visible?: string) {
    if (!texto.trim() || cargando) return;
    const nuevo: Mensaje = { rol: "usuario", texto, visible };
    const lista = [...mensajes, nuevo];
    setMensajes(lista);
    setEntrada("");
    setCargando(true);
    setEstadoCarga("Pensando en tu tienda…");
    const temporizador = setTimeout(() => setEstadoCarga("Aplicando cambios y revisando el diseño…"), 9000);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceras() },
        body: JSON.stringify({
          mensajes: lista.filter((m) => m.texto !== BIENVENIDA.texto).map((m) => ({ rol: m.rol, texto: m.texto })),
          tienda,
          fotos: fotos.map((f) => ({ ref: "foto:" + f.id, nombre: f.nombre })),
          erroresVistaPrevia: errores,
        }),
      });
      const datos = await r.json();
      if (r.status === 401) {
        setPedirCodigo(true);
        throw new Error(datos.error);
      }
      if (!r.ok) throw new Error(datos.error || "Error desconocido");
      if (datos.cambios > 0) cambiarTienda(normalizarTienda(datos.tienda));
      setMensajes((m) => [...m, { rol: "asistente", texto: datos.respuesta, propuestas: datos.propuestas ?? undefined }]);
    } catch (e) {
      setMensajes((m) => [
        ...m,
        { rol: "asistente", texto: "⚠️ " + (e instanceof Error ? e.message : "No pude conectarme. Intenta de nuevo.") },
      ]);
    } finally {
      clearTimeout(temporizador);
      setCargando(false);
    }
  }

  function aplicarPropuesta(p: Propuesta) {
    cambiarTienda(normalizarTienda(mezclar(tienda, { tema: p.tema, textos: p.textos ?? {} })));
    setMensajes((m) => [
      ...m,
      { rol: "usuario", texto: `Elegí el estilo «${p.nombre}».` },
      {
        rol: "asistente",
        texto: `✅ Apliqué el estilo **${p.nombre}**. Revisa la vista previa y dime qué quieres ajustar: colores, fuentes, textos, la portada…`,
      },
    ]);
    setVistaMovil("tienda");
  }

  async function subirPlantilla(archivo: File) {
    setCargando(true);
    setEstadoCarga("Leyendo tu plantilla…");
    try {
      const form = new FormData();
      form.append("archivo", archivo);
      const r = await fetch("/api/plantilla", { method: "POST", body: form, headers: cabeceras() });
      const datos = await r.json();
      if (r.status === 401) setPedirCodigo(true);
      if (!r.ok) throw new Error(datos.error);
      setCargando(false);
      await enviar(
        "Esta es la plantilla de la entrevista con la información del negocio. Úsala para transformar toda la tienda y luego proponme 3 estilos:\n\n" +
          datos.texto,
        `Subí la plantilla «${archivo.name}»`,
      );
    } catch (e) {
      setMensajes((m) => [...m, { rol: "asistente", texto: "⚠️ " + (e instanceof Error ? e.message : "No pude leer la plantilla.") }]);
      setCargando(false);
    }
  }

  async function subirFotos(archivos: FileList) {
    const nuevas: Foto[] = [];
    for (const a of Array.from(archivos)) {
      if (!a.type.startsWith("image/")) continue;
      try {
        const f = await prepararFoto(a);
        await guardarFoto(f);
        nuevas.push(f);
      } catch {
        /* imagen ilegible */
      }
    }
    if (!nuevas.length) return;
    setFotos((f) => [...f, ...nuevas]);
    setVerFotos(true);
    setEntrada(
      `Subí ${nuevas.length} foto${nuevas.length > 1 ? "s" : ""}: ${nuevas.map((f) => f.nombre).join(", ")}. Asígnalas a los productos que correspondan.`,
    );
  }

  async function quitarFoto(id: string) {
    await borrarFoto(id);
    setFotos((f) => f.filter((x) => x.id !== id));
  }

  async function descargar(formato: FormatoDescarga) {
    setMenuDescarga(false);
    const { blob, nombre } = await generarDescarga(tienda, mapaFotos, formato);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function abrirTienda(archivos: File[]) {
    setMenuAbrir(false);
    if (!archivos.length) return;
    const hayTrabajo = historial.length > 0 || tienda.negocio.nombre !== TIENDA_BASE.negocio.nombre;
    if (hayTrabajo && !confirm("Se reemplazará la tienda que tienes abierta ahora por la que vas a subir. ¿Continuar?")) return;
    setCargando(true);
    setEstadoCarga("Abriendo tu tienda…");
    try {
      const r = await importarTienda(archivos);
      await borrarTodasLasFotos();
      for (const f of r.fotos) await guardarFoto(f);
      setFotos(r.fotos);
      setHistorial([]);
      setTienda(r.tienda);
      const resumen =
        `✅ Recuperé tu tienda **${r.tienda.negocio.nombre}**: ${r.tienda.productos.length} productos y ${r.fotos.length} fotos.` +
        (r.avisos.length ? "\n\n" + r.avisos.map((a) => "- " + a).join("\n") : "") +
        "\n\n¿Qué quieres cambiar hoy?";
      setMensajes([BIENVENIDA, { rol: "asistente", texto: resumen }]);
      setVistaMovil("tienda");
    } catch (e) {
      setMensajes((m) => [...m, { rol: "asistente", texto: "⚠️ " + (e instanceof Error ? e.message : "No pude abrir esos archivos.") }]);
    } finally {
      setCargando(false);
    }
  }

  async function nuevoProyecto() {
    if (!confirm("¿Empezar un proyecto nuevo? Se borrará la tienda, el chat y las fotos de este navegador.")) return;
    await borrarTodasLasFotos();
    setFotos([]);
    setTienda(TIENDA_BASE);
    setHistorial([]);
    setMensajes([BIENVENIDA]);
  }

  function guardarCodigo(valor: string) {
    setCodigo(valor);
    escribirLocal(CLAVE_CODIGO, valor);
    setPedirCodigo(false);
  }

  if (!montado) return <div className="cargando-app">Cargando…</div>;

  return (
    <div className={`app vista-${vistaMovil}`}>
      <header className="barra">
        <div className="marca">
          <span className="marca-icono">H</span>
          <div>
            <strong>Harvys</strong>
            <small>Prof. Harvey Sanabria · {tienda.negocio.nombre}</small>
          </div>
        </div>
        <div className="pestanas-movil">
          <button className={vistaMovil === "chat" ? "activa" : ""} onClick={() => setVistaMovil("chat")}>
            <Icono nombre="chat" /> Chat
          </button>
          <button className={vistaMovil === "tienda" ? "activa" : ""} onClick={() => setVistaMovil("tienda")}>
            <Icono nombre="ojo" /> Tienda
          </button>
        </div>
        <div className="acciones">
          <button onClick={deshacer} disabled={!historial.length} title="Deshacer el último cambio">
            <Icono nombre="deshacer" /> <span>Deshacer</span>
          </button>
          <div className="menu-descarga">
            <button onClick={() => setMenuAbrir((v) => !v)} disabled={cargando} title="Abrir una tienda descargada antes">
              <Icono nombre="subir" /> <span>Abrir</span>
            </button>
            {menuAbrir && (
              <>
                <div className="menu-fondo" onClick={() => setMenuAbrir(false)} />
                <div className="menu-opciones">
                  <button onClick={() => inputAbrir.current?.click()}>
                    <strong><Icono nombre="paquete" /> Subir el .zip</strong>
                    <small>El que descargaste de Harvys (o el de GitHub: Code → Download ZIP)</small>
                  </button>
                  <button onClick={() => inputCarpeta.current?.click()}>
                    <strong><Icono nombre="carpeta" /> Subir la carpeta del proyecto</strong>
                    <small>La carpeta con index.html, styles.css, script.js e img/</small>
                  </button>
                  <small className="menu-nota">Tu tienda y sus fotos vuelven tal como las dejaste.</small>
                </div>
              </>
            )}
            <input
              ref={inputAbrir}
              type="file"
              accept=".zip,.html,.js,.css,image/*"
              multiple
              hidden
              onChange={(e) => {
                abrirTienda(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            <input
              ref={inputCarpeta}
              type="file"
              multiple
              hidden
              {...({ webkitdirectory: "" } as Record<string, string>)}
              onChange={(e) => {
                abrirTienda(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
          <div className="menu-descarga">
            <button onClick={() => setMenuDescarga((v) => !v)} className="primario" title="Descargar la tienda">
              <Icono nombre="descargar" /> <span>Descargar</span> <Icono nombre="abajo" tamano={14} />
            </button>
            {menuDescarga && (
              <>
                <div className="menu-fondo" onClick={() => setMenuDescarga(false)} />
                <div className="menu-opciones">
                  <button onClick={() => descargar("pages")}>
                    <strong><Icono nombre="paquete" /> Proyecto para GitHub Pages (.zip)</strong>
                    <small>index.html + styles.css + script.js + img/ + README con los pasos</small>
                  </button>
                  <button onClick={() => descargar("unico")}>
                    <strong><Icono nombre="archivo" /> Todo en un solo archivo (.zip)</strong>
                    <small>index.html con CSS y JS adentro + img/</small>
                  </button>
                  <div className="menu-separador">Archivos sueltos</div>
                  <div className="menu-sueltos">
                    <button onClick={() => descargar("index.html")}>index.html</button>
                    <button onClick={() => descargar("styles.css")}>styles.css</button>
                    <button onClick={() => descargar("script.js")}>script.js</button>
                  </div>
                  <small className="menu-nota">Los sueltos usan las fotos de la carpeta img/ (vienen en los .zip).</small>
                  <div className="menu-separador">Backend</div>
                  <button onClick={() => descargar("Code.gs")}>
                    <strong><Icono nombre="tabla" /> Inventario con Google Sheets (Code.gs)</strong>
                    <small>Apps Script con tus productos: stock, precios y registro de pedidos</small>
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={nuevoProyecto} title="Empezar de cero">
            <Icono nombre="mas" /> <span>Nuevo</span>
          </button>
        </div>
      </header>

      <main className="cuerpo">
        <section className="panel-chat">
          <div className="mensajes">
            {mensajes.map((m, i) => (
              <div key={i} className={`mensaje ${m.rol}`}>
                <div className="burbuja">
                  {m.rol === "asistente" ? <TextoFormateado texto={m.texto} /> : <p>{m.visible ?? m.texto}</p>}
                </div>
                {m.propuestas && (
                  <div className="propuestas">
                    {m.propuestas.map((p, k) => (
                      <div key={k} className="propuesta">
                        <MiniVista
                          html={renderTienda(normalizarTienda(mezclar(tienda, { tema: p.tema, textos: p.textos ?? {} })), {
                            resolverImagen,
                          })}
                        />
                        <div className="propuesta-info">
                          <strong>{p.nombre}</strong>
                          <p>{p.descripcion}</p>
                          <div className="paleta">
                            {[p.tema.colores.fondo, p.tema.colores.primario, p.tema.colores.acento, p.tema.colores.texto].map((c, j) => (
                              <span key={j} style={{ background: c }} />
                            ))}
                          </div>
                          <button onClick={() => aplicarPropuesta(p)}>Usar este estilo</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {cargando && (
              <div className="mensaje asistente">
                <div className="burbuja escribiendo">
                  <span className="puntos">
                    <i />
                    <i />
                    <i />
                  </span>
                  {estadoCarga}
                </div>
              </div>
            )}
            <div ref={finChat} />
          </div>

          {errores.length > 0 && !cargando && (
            <div className="aviso-errores">
              <Icono nombre="alerta" /> La vista previa tiene {errores.length} error{errores.length > 1 ? "es" : ""}.
              <button onClick={() => enviar("La vista previa muestra errores. Por favor corrígelos.")}>Pedir que los corrija</button>
            </div>
          )}

          {verFotos && (
            <div className="galeria">
              <div className="galeria-cabecera">
                <strong>Fotos del negocio ({fotos.length})</strong>
                <button onClick={() => setVerFotos(false)} aria-label="Cerrar">
                  ✕
                </button>
              </div>
              {fotos.length === 0 ? (
                <p className="vacio">Aún no has subido fotos. Recuerda: deben ser reales, tomadas en el negocio.</p>
              ) : (
                <div className="galeria-grid">
                  {fotos.map((f) => (
                    <figure key={f.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.dataUrl} alt={f.nombre} />
                      <figcaption title={f.nombre}>{f.nombre}</figcaption>
                      <button onClick={() => quitarFoto(f.id)} aria-label={`Quitar ${f.nombre}`}>
                        ✕
                      </button>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          )}

          {mensajes.length <= 1 && !cargando && (
            <div className="sugerencias">
              {SUGERENCIAS.map((s) => (
                <button key={s} onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="compositor"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(entrada);
            }}
          >
            <div className="adjuntos">
              <button type="button" onClick={() => inputPlantilla.current?.click()} disabled={cargando} title="Subir plantilla de entrevista (.docx)">
                <Icono nombre="archivo" /> Plantilla
              </button>
              <button type="button" onClick={() => inputFotos.current?.click()} disabled={cargando} title="Subir fotos de productos">
                <Icono nombre="camara" /> Fotos
              </button>
              <button type="button" onClick={() => setVerFotos((v) => !v)} title="Ver fotos subidas">
                <Icono nombre="imagenes" /> {fotos.length}
              </button>
              <input
                ref={inputPlantilla}
                type="file"
                accept=".docx,.txt"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) subirPlantilla(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <input
                ref={inputFotos}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) subirFotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="campo">
              <textarea
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar(entrada);
                  }
                }}
                placeholder="Escribe lo que quieres cambiar en tu tienda…"
                rows={2}
                disabled={cargando}
              />
              <button type="submit" disabled={cargando || !entrada.trim()} aria-label="Enviar">
                <Icono nombre="enviar" tamano={18} />
              </button>
            </div>
          </form>
          <p className="credito">Harvys · Asistente de e-commerce creado por el Profesor Harvey Sanabria</p>
        </section>

        <section className="panel-vista">
          <div className="vista-barra">
            <div className="dispositivos">
              <button className={dispositivo === "escritorio" ? "activa" : ""} onClick={() => setDispositivo("escritorio")}>
                <Icono nombre="computador" /> Computador
              </button>
              <button className={dispositivo === "movil" ? "activa" : ""} onClick={() => setDispositivo("movil")}>
                <Icono nombre="celular" /> Celular
              </button>
            </div>
            <button className={`revision-boton ${cumplidos === requisitos.length ? "ok" : ""}`} onClick={() => setVerRevision((v) => !v)}>
              <Icono nombre={cumplidos === requisitos.length ? "listo" : "lista"} /> Requisitos {cumplidos}/{requisitos.length}
            </button>
          </div>

          {verRevision && (
            <div className="revision">
              {revision.map((r, i) => (
                <div key={i} className={`revision-item ${r.ok ? "ok" : "falta"} ${r.nivel}`}>
                  <span>{r.ok ? "✓" : r.nivel === "requisito" ? "✗" : "•"}</span>
                  {r.texto}
                </div>
              ))}
            </div>
          )}

          <div className={`marco marco-${dispositivo}`}>
            <iframe
              srcDoc={html}
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals"
              title="Vista previa de la tienda"
            />
          </div>
        </section>
      </main>

      {pedirCodigo && (
        <div className="modal-codigo">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarCodigo(String(new FormData(e.currentTarget).get("codigo") || ""));
            }}
          >
            <h2>Código de la clase</h2>
            <p>Escribe el código de acceso que te dio tu profesor.</p>
            <input name="codigo" autoFocus defaultValue={codigo} />
            <button type="submit">Guardar</button>
          </form>
        </div>
      )}
    </div>
  );
}
