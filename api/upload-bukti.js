import formidable from "formidable";
import fs from "fs";
import { Blob } from "buffer";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  const form = formidable({
    multiples: false,
    uploadDir: "/tmp",
    keepExtensions: true,
    filename: (name, ext, part) => {
      return `upload-${Date.now()}${ext}`;
    },
  });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    console.log("FILE MASUK =>", file);

    const buffer = fs.readFileSync(file.filepath);
    const blobFile = new Blob([buffer], { type: file.mimetype });

    // TELEGRAM
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📸 Bukti Pembayaran Baru Diterima");
    formData.append("photo", blobFile, file.originalFilename || "bukti.jpg");

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await telegramRes.json();
    console.log("RESP TELEGRAM =>", result);

    return res.status(200).json({ success: true, result });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: "Upload gagal", detail: err });
  }
}
