/**
 * @file lib/imageValidator.ts
 * @description Validación segura de archivos de imagen.
 *
 * POR QUÉ magic bytes y no solo MIME type:
 * - El MIME type lo declara el navegador/cliente y puede falsificarse.
 * - Los magic bytes son los primeros bytes reales del archivo y no mienten.
 * - Esto previene que alguien renombre un .php o .exe como .jpg y lo suba.
 */

/** Tamaño máximo permitido: 5 MB */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** MIME types permitidos */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Firmas de bytes reconocidas para cada formato de imagen.
 * Se leen los primeros bytes del archivo para confirmar que realmente
 * es lo que dice ser, independientemente de su extensión o MIME type.
 */
const MAGIC_SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif",  bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
];

/**
 * Lee los primeros bytes de un File para verificar su firma real.
 * @param file Archivo a validar
 * @returns true si la firma coincide con un tipo de imagen conocido
 */
async function checkMagicBytes(file: File): Promise<boolean> {
  // Solo necesitamos los primeros 12 bytes para todas las firmas
  const slice = file.slice(0, 12);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return MAGIC_SIGNATURES.some(({ bytes: sig, offset = 0 }) =>
    sig.every((byte, i) => bytes[offset + i] === byte)
  );
}

/**
 * Valida un archivo de imagen de forma completa:
 * 1. Tamaño máximo
 * 2. MIME type declarado
 * 3. Magic bytes reales del archivo
 *
 * @param file Archivo a validar
 * @returns null si es válido, o un mensaje de error si no lo es
 */
export async function validateImage(file: File): Promise<string | null> {
  if (file.size > MAX_IMAGE_SIZE) {
    return `El archivo supera el límite de 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Tipo de archivo no permitido. Solo se aceptan JPG, PNG, WebP y GIF.`;
  }

  const isValidContent = await checkMagicBytes(file);
  if (!isValidContent) {
    // El archivo no es lo que dice ser — posible exploit
    return "El contenido del archivo no corresponde a una imagen válida.";
  }

  return null;
}

/**
 * Genera un nombre de archivo seguro para almacenamiento:
 * - UUID para evitar colisiones y enumeración
 * - Extensión derivada del MIME type real, no del nombre original
 */
export function safeFileName(mimeType: string): string {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png":  "png",
    "image/webp": "webp",
    "image/gif":  "gif",
  };
  const ext = extMap[mimeType] ?? "jpg";
  // crypto.randomUUID() es estándar en navegadores modernos y Node 14.17+
  return `${crypto.randomUUID()}.${ext}`;
}