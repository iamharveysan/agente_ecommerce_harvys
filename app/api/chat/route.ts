import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ejecutarAgente, type EntradaAgente } from "@/lib/agente";
import { codigoValido } from "@/lib/acceso";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!codigoValido(req)) return NextResponse.json({ error: "Código de acceso incorrecto." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json({ error: "Falta configurar OPENAI_API_KEY en el servidor." }, { status: 500 });

  let entrada: EntradaAgente;
  try {
    entrada = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  try {
    return NextResponse.json(await ejecutarAgente(entrada));
  } catch (e) {
    console.error(e);
    let mensaje = "No pude completar la solicitud. Intenta de nuevo.";
    if (e instanceof OpenAI.APIError) {
      if (e.status === 401) mensaje = "La clave de OpenAI no es válida.";
      else if (e.status === 429) mensaje = "Se alcanzó el límite de uso de la API. Espera un momento e intenta de nuevo.";
      else if (e.status === 404) mensaje = "El modelo configurado no existe o no está disponible para esta cuenta.";
      else mensaje = `Error de la API (${e.status}): ${e.message}`;
    }
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
