import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { codigoValido } from "@/lib/acceso";

export const runtime = "nodejs";

// Extrae el texto de la plantilla de entrevista (.docx o .txt) para dárselo al agente.
export async function POST(req: Request) {
  if (!codigoValido(req))
    return NextResponse.json({ error: "Código de acceso incorrecto." }, { status: 401 });

  const form = await req.formData();
  const archivo = form.get("archivo");
  if (!(archivo instanceof File)) return NextResponse.json({ error: "No llegó ningún archivo." }, { status: 400 });
  if (archivo.size > 10 * 1024 * 1024) return NextResponse.json({ error: "El archivo supera 10 MB." }, { status: 400 });

  const buffer = Buffer.from(await archivo.arrayBuffer());
  try {
    let texto: string;
    if (archivo.name.toLowerCase().endsWith(".docx")) {
      texto = (await mammoth.extractRawText({ buffer })).value;
    } else {
      texto = buffer.toString("utf8");
    }
    texto = texto.replace(/\n{3,}/g, "\n\n").trim().slice(0, 40000);
    return NextResponse.json({ texto });
  } catch {
    return NextResponse.json({ error: "No pude leer el archivo. Súbelo en formato .docx." }, { status: 400 });
  }
}
