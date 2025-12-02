export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: "Gagal parsing form" });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      const formData = new FormData();
      formData.append(
        "photo",
        fs.createReadStream(file.filepath),
        file.originalFilename
      );
      formData.append("chat_id", chatId);
      formData.append("caption", "Bukti Pembayaran Baru");

      const telegramRes = await fetch(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        {
          method: "POST",
          body: formData,
          headers: formData.getHeaders(),
        }
      );

      const data = await telegramRes.json();

      res.status(200).json({ success: true, telegram: data });
    } catch (error) {
      console.error("Upload gagal:", error);
      res.status(500).json({ error: "Gagal upload ke Telegram" });
    }
  });
}
