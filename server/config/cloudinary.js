import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryConfigured() {
  return configured;
}

export function uploadImage(file, folder) {
  if (!configured) throw new Error("Cloudinary is not configured.");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error) return reject(error);
      return resolve(result.secure_url);
    });
    Readable.from([file.buffer]).pipe(stream);
  });
}

export async function deleteImageByUrl(url) {
  if (!configured || !url) return;
  const uploadPath = String(url).split("/upload/")[1];
  if (!uploadPath) return;
  const publicId = uploadPath.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}