import formidable from "formidable";
import fs from "fs";
import path from "path";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    // FOLDER UPLOAD FIX VERCEL
    const uploadDir = "/tmp";

    const form = formidable({
      multiples: false,
      uploadDir,
      keepExtensions: true,
      filename: (name, ext) => {
        return "bukti-" + Date.now() + ext;
      },
    });

    // FORMIDABLE PARSE METODE BARU (WAJIB DI V3)
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

    // BACA BUFFER
    const fileBuffer = fs.readFileSync(file.filepath);

    // TELEGRAM
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📸 Bukti Pembayaran Baru Masuk");
    formData.append("photo", fileBuffer, {
      filename: file.originalFilename || "bukti.jpg",
      contentType: file.mimetype,
    });

    // KIRIM
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await telegramRes.json();

    return res.status(200).json({
      success: true,
      telegram: result,
    });
  } catch (err) {
    console.error("ERROR UPLOAD:", err);
    return res.status(500).json({
      error: "Upload gagal",
      detail: err.toString(),
    });
  }
}
