import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

// El SDK lee CLOUDINARY_URL del entorno (cloudinary://key:secret@cloud_name).
if (env.CLOUDINARY_URL) cloudinary.config({ secure: true });

const folder = "sdreservas/restaurants";
const publicIdOf = (restauranteId: string) => `${folder}/${restauranteId}`;

function ensureConfigured() {
  if (!env.CLOUDINARY_URL) {
    throw new AppError(503, "IMAGES_UNAVAILABLE", "El servicio de imágenes no está configurado");
  }
}

// Valida el contenido real (no la extensión ni el Content-Type declarado).
export function esImagenValida(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || webp;
}

/** Sube (o reemplaza) la imagen del restaurante y devuelve la URL https. */
export async function subirImagenRestaurante(restauranteId: string, buf: Buffer): Promise<string> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicIdOf(restauranteId),
          overwrite: true,
          invalidate: true,
          resource_type: "image",
          // Se limita lo que se guarda: máx. 1600x1200, sin agrandar imágenes pequeñas.
          transformation: [{ width: 1600, height: 1200, crop: "limit" }],
        },
        (error, result) => {
          if (error || !result) {
            console.error("Cloudinary upload error", error);
            return reject(new AppError(502, "IMAGES_UPSTREAM", "No se pudo guardar la imagen"));
          }
          resolve(result.secure_url);
        },
      )
      .end(buf);
  });
}

export async function eliminarImagenRestaurante(restauranteId: string): Promise<void> {
  ensureConfigured();
  try {
    await cloudinary.uploader.destroy(publicIdOf(restauranteId), { invalidate: true });
  } catch (error) {
    console.error("Cloudinary destroy error", error);
    throw new AppError(502, "IMAGES_UPSTREAM", "No se pudo eliminar la imagen");
  }
}
