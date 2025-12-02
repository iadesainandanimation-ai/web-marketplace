import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  const form = formidable({});
  
  try {
    const [fields, files] = await form.parse(req);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const file = files.file;
    
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "Bukti Pembayaran Baru");
    formData.append("photo", fs.createReadStream(file.filepath), file.originalFilename);

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await telegramRes.json();

    return res.status(200).json({ success: true, telegram: data });
  } catch (error) {
    console.log("Error upload:", error);
    return res.status(500).json({ error: "Upload gagal" });
  }
}
