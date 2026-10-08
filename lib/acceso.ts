// Si se define CODIGO_ACCESO, solo quien tenga el código de la clase puede usar la API.
export function codigoValido(req: Request): boolean {
  const codigo = process.env.CODIGO_ACCESO;
  return !codigo || req.headers.get("x-codigo-acceso") === codigo;
}
