import formidable from "formidable";
import fs from "fs";
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

  // =============================
  // CONFIG FORMIDABLE FIX UNTUK VERCEL
  // =============================
  const form = formidable({
    multiples: false,
    uploadDir: "/tmp",          // <= WAJIB! folder aman di Vercel
    keepExtensions: true,
  });

  try {
    const [fields, files] = await form.parse(req);

    const file = files.file;

    if (!file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    console.log("FILE DITERIMA =>", file);

    // =============================
    // AMBIL FILE BUFFER
    // =============================
    const fileBuffer = fs.readFileSync(file.filepath);

    // TELEGRAM CONFIG
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📸 Bukti Pembayaran Baru Masuk");
    formData.append("photo", fileBuffer, {
      filename: file.originalFilename || "bukti.jpg",
      contentType: file.mimetype || "image/jpeg",
    });

    // =============================
    // KIRIM KE TELEGRAM
    // =============================
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData,
        headers: formData.getHeaders(),
      }
    );

    const data = await telegramRes.json();
    console.log("RESP TELEGRAM =>", data);

    return res.status(200).json({
      success: true,
      telegram: data,
    });

  } catch (err) {
    console.error("ERROR UPLOAD:", err);
    return res.status(500).json({ error: "Upload gagal", detail: err });
  }
}
