// Modelo de datos de una tienda. El agente modifica este objeto y el renderizador
// lo convierte en el HTML final, así las funciones obligatorias nunca se rompen.

export type OpcionProducto = { etiqueta: string; valores: string[] };

export type Producto = {
  id: string;
  nombre: string;
  precio: number; // entero en COP, ej: 12000
  categoria: string;
  imagen: string; // URL o "foto:<id>" de una foto subida por el estudiante
  descripcion?: string;
  opciones?: OpcionProducto | null; // tallas, porciones, tonos...
  destacado?: boolean;
};

export type Beneficio = { icono: string; titulo: string; texto: string };
export type Testimonio = { nombre: string; texto: string };
export type Estadistica = { valor: string; etiqueta: string };

export type MetodoPago = {
  nombre: string;
  icono: string;
  tipo: "transferencia" | "contraentrega";
};

export type Tema = {
  nombreEstilo: string;
  modo: "oscuro" | "claro";
  colores: {
    primario: string;
    textoSobrePrimario: string;
    fondo: string;
    fondoAlterno: string;
    tarjeta: string;
    texto: string;
    textoSuave: string;
    acento: string;
  };
  fuentes: { titulos: string; cuerpo: string }; // nombres de Google Fonts
  titulosMayusculas: boolean;
  radio: number; // px
  animaciones: "alta" | "media" | "baja";
  fondoEfecto: "cuadricula" | "brillo" | "puntos" | "ninguno";
  hero: "centrado" | "dividido" | "compacto";
  tarjetas: "elevadas" | "planas" | "borde";
};

export type Textos = {
  heroEtiqueta: string;
  heroTitulo: string;
  heroTituloResaltado: string;
  heroSubtitulo: string;
  heroBoton: string;
  heroImagen: string;
  estadisticas: Estadistica[];
  bannerEtiqueta: string;
  bannerTitulo: string;
  bannerTituloResaltado: string;
  bannerTexto: string;
  chips: string[];
  catalogoEtiqueta: string;
  catalogoTitulo: string;
  botonAgregar: string;
  beneficiosEtiqueta: string;
  beneficiosTitulo: string;
  recomendadosEtiqueta: string;
  recomendadosTitulo: string;
  topEtiqueta: string;
  topTitulo: string;
  dueloEtiqueta: string;
  dueloTitulo: string;
  dueloInfo: string;
  testimoniosEtiqueta: string;
  testimoniosTitulo: string;
  horariosEtiqueta: string;
  horariosTitulo: string;
  footerTexto: string;
  footerFrase: string;
  carritoTitulo: string;
  botonPagar: string;
};

export type SeccionPersonalizada = { id: string; html: string };

export type Tienda = {
  negocio: {
    nombre: string;
    descripcion: string;
    eslogan: string;
    ciudad: string;
    cobertura: string;
    whatsapp: string; // con indicativo, solo dígitos: 573001234567
    instagram: string;
    facebook: string;
    tiktok: string;
    horarios: string[];
    logo: string;
  };
  tema: Tema;
  textos: Textos;
  productos: Producto[];
  beneficios: Beneficio[];
  testimonios: Testimonio[];
  pagos: {
    metodos: MetodoPago[];
    numeroTransferencia: string;
    titular: string;
    contraentregaDetalle: string;
  };
  // Orden de las secciones. Ids fijos o "custom:<id>" para secciones personalizadas.
  secciones: string[];
  personalizado: { css: string; secciones: SeccionPersonalizada[] };
};

export const SECCIONES_OBLIGATORIAS = ["catalogo", "beneficios", "recomendados", "top", "duelo"];
export const SECCIONES_DISPONIBLES = [
  "banner",
  "catalogo",
  "beneficios",
  "recomendados",
  "top",
  "duelo",
  "testimonios",
  "horarios",
];

export type Propuesta = {
  nombre: string;
  descripcion: string;
  tema: Tema;
  textos?: Partial<Textos>;
};

export type FotoInfo = { ref: string; nombre: string };
