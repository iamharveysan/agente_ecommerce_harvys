# Harvys — Asistente de e-commerce

**Autor:** Profesor Harvey Sanabria

Asistente con IA para que los estudiantes construyan la tienda virtual de un negocio real.
Toma como base la tienda GLAXON y la personaliza con la información de la plantilla de entrevista:
contenido, estilo visual (colores, tipografías, portada, tarjetas) y estructura.

## Cómo funciona

- **La tienda es un objeto JSON** (`lib/tipos.ts`). El agente lo modifica con herramientas y
  `lib/render.ts` lo convierte en un HTML completo. Así las funciones obligatorias (carrito,
  filtros, WhatsApp, top, duelo ELO…) nunca se rompen.
- **Agente** (`lib/agente.ts`): OpenAI Responses API con herramientas:
  `actualizar_tienda`, `gestionar_productos`, `css_personalizado`, `seccion_personalizada`
  y `proponer_estilos`.
- **Estilos base** (`lib/estilos.ts`): deportivo, elegante, femenino, minimalista, juvenil,
  premium y moderno, los mismos de la plantilla.
- **Revisión automática** (`lib/validar.ts`): requisitos del proyecto y contraste de colores.
- **Fotos**: se reducen en el navegador y se guardan en IndexedDB; al descargar van en `img/`.
- **Descargas**: proyecto para GitHub Pages (`index.html` + `styles.css` + `script.js` + `img/`), todo en un solo archivo, o cada archivo suelto (`lib/exportar.ts`).
- Cada proyecto se guarda en el navegador del estudiante (no hay base de datos todavía).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y escribe tu OPENAI_API_KEY
npm run dev
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | Sí | Clave de la API de OpenAI |
| `OPENAI_MODEL` | No | Modelo (por defecto `gpt-6.1-sol`) |
| `OPENAI_REASONING` | No | `low`, `medium` (defecto) o `high` |
| `CODIGO_ACCESO` | No | Si se define, los estudiantes deben escribir este código para usar la app |

## Despliegue en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En vercel.com → *Add New Project* → importa el repositorio.
3. En *Environment Variables* agrega `OPENAI_API_KEY` y `CODIGO_ACCESO`.
4. *Deploy*.

Recomendado: en el panel de OpenAI define un límite de gasto mensual para la clave.

---

© 2026 Profesor Harvey Sanabria. Todos los derechos reservados.
