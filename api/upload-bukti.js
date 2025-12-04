import fs from "fs";
import FormData from "form-data";
const { Formidable } = require('formidable'); 

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  let tempFilePath = null;

  try {
    const uploadDir = "/tmp";

    const form = new Formidable({ 
      multiples: false,
      uploadDir,
      keepExtensions: true,
      filename: (name, ext) => {
        return "bukti-" + Date.now() + ext;
      },
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const fileData = files.file;
    const file = Array.isArray(fileData) ? fileData[0] : fileData; 

    if (!file || !file.filepath) {
      return res.status(400).json({ error: "File bukti pembayaran tidak ditemukan atau path tidak valid." });
    }
    
    tempFilePath = file.filepath;

    const fileBuffer = fs.readFileSync(file.filepath); 

    // --- LOGIKA TELEGRAM ---
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📸 Bukti Pembayaran Baru Masuk (via Web)");
    formData.append("photo", fileBuffer, { // Field name harus 'photo'
      filename: file.originalFilename || "bukti.jpg",
      contentType: file.mimetype,
    });
    
    // === PERBAIKAN: Menambahkan headers yang dibuat oleh FormData ===
    const headers = formData.getHeaders();

    // KIRIM KE TELEGRAM
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        // WAJIB: masukkan headers yang mengandung Content-Type multipart/form-data dengan boundary
        headers: headers, 
        body: formData, // formData harus dilewatkan sebagai body
      }
    );

    const result = await telegramRes.json();

    if (!result.ok) {
        // Log error di server, tapi kembalikan 200 ke user karena file sudah terupload
        console.error("Gagal kirim ke Telegram:", result);
    }

    // --- RESPON SUKSES ---
    return res.status(200).json({
      success: true,
      telegram: result,
      message: "Bukti berhasil diunggah dan dikirim ke Telegram."
    });

  } catch (err) {
    console.error("ERROR UPLOAD FINAL:", err);
    
    let errorMessage = "Upload gagal";
    if (err.code === 'LIMIT_FILE_SIZE') { 
        errorMessage = "Ukuran file terlalu besar. Maksimal 5MB.";
    }

    return res.status(500).json({
      error: errorMessage,
      detail: err.toString(),
    });

  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
            fs.unlinkSync(tempFilePath);
            console.log(`File sementara dihapus: ${tempFilePath}`);
        } catch (unlinkError) {
            console.error(`Gagal menghapus file sementara: ${unlinkError}`);
        }
    }
  }
  }
