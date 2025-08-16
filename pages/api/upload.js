// pages/api/upload.js
import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";

export const config = { api: { bodyParser: false } };

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 }); // 10MB
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Upload parse error" });
    const file = files?.file;
    if (!file) return res.status(400).json({ error: "No file" });

    try {
      const upload = await cloudinary.uploader.upload(file.filepath, {
        folder: process.env.CLOUDINARY_FOLDER || "uploads",
        resource_type: "image",
        overwrite: false,
      });
      return res.status(200).json({ url: upload.secure_url, public_id: upload.public_id });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Cloud upload failed" });
    }
  });
}
