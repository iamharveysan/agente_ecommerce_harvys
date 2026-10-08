import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harvys — Asistente de e-commerce",
  description: "Harvys: asistente con IA para que los estudiantes construyan la tienda virtual de un negocio real. Creado por el Profesor Harvey Sanabria.",
  authors: [{ name: "Profesor Harvey Sanabria" }],
  creator: "Profesor Harvey Sanabria",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
