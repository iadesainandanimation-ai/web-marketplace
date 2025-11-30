export const config = {
  api: {
    bodyParser: false, // wajib, biar bisa terima file
  },
};

import formidable from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const form = formidable();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Gagal parsing file" });
      }

      const file = files.file;
      const fileBuffer = fs.readFileSync(file.filepath);

      // kirim ke Telegram
      const telegramRes = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
        {
          method: "POST",
          body: (() => {
            const formData = new FormData();
            formData.append("chat_id", process.env.TELEGRAM_CHAT_ID);
            formData.append("photo", new Blob([fileBuffer]), file.originalFilename);
            return formData;
          })(),
        }
      );

      const data = await telegramRes.json();
      return res.status(200).json({ success: true, data });
    });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "Gagal kirim ke Telegram" });
  }
}
