// Fotos del estudiante: se reducen en el navegador y se guardan en IndexedDB
// (localStorage no alcanza para imágenes).
export type Foto = { id: string; nombre: string; dataUrl: string };

const DB = "constructor-ecommerce";
const STORE = "fotos";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function operacion<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, modo).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listarFotos(): Promise<Foto[]> {
  try {
    return await operacion<Foto[]>("readonly", (s) => s.getAll() as IDBRequest<Foto[]>);
  } catch {
    return [];
  }
}
export const guardarFoto = (f: Foto) => operacion("readwrite", (s) => s.put(f));
export const borrarFoto = (id: string) => operacion("readwrite", (s) => s.delete(id));
export const borrarTodasLasFotos = () => operacion("readwrite", (s) => s.clear());

export async function prepararFoto(archivo: File, max = 1100): Promise<Foto> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d")!;
  const png = archivo.type === "image/png";
  if (!png) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return {
    id: Math.random().toString(36).slice(2, 8),
    nombre: archivo.name,
    dataUrl: png ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.82),
  };
}
