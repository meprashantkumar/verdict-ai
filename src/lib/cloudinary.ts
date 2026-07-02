import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadFile(
  file: Buffer,
  options: { folder?: string; resource_type?: "image" | "video" | "raw" | "auto" } = {}
) {
  return new Promise<{ url: string; publicId: string; format: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: options.folder ?? "verdictai",
          resource_type: options.resource_type ?? "auto",
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
          });
        }
      )
      .end(file);
  });
}

export async function deleteFile(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
