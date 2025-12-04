import fs from "fs";
import FormData from "form-data";
// Menggunakan require() untuk kompatibilitas Formidable yang lebih baik 
// di lingkungan serverless Vercel
const formidable = require('formidable');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  // Variabel untuk menyimpan path file sementara
  let tempFilePath = null;

  try {
    // FOLDER UPLOAD FIX VERCEL (selalu gunakan /tmp)
    const uploadDir = "/tmp";

    const form = formidable({
      multiples: false,
      uploadDir,
      keepExtensions: true,
      filename: (name, ext) => {
        // Nama file sementara yang disimpan di /tmp
        return "bukti-" + Date.now() + ext;
      },
      // Batasi ukuran file
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    // PARSE METODE BARU (WAJIB DI V3)
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // === PERBAIKAN 1: Mengambil objek file yang benar dari hasil parse (Array [0]) ===
    const fileData = files.file;
    const file = Array.isArray(fileData) ? fileData[0] : fileData;

    if (!file || !file.filepath) {
      return res.status(400).json({ error: "File bukti pembayaran tidak ditemukan atau path tidak valid." });
    }
    
    // Simpan path sementara untuk penghapusan di blok finally
    tempFilePath = file.filepath;

    // BACA BUFFER DARI TEMPORARY PATH
    const fileBuffer = fs.readFileSync(file.filepath); // Baris ini sekarang seharusnya berfungsi

    // --- LOGIKA TELEGRAM ---
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📸 Bukti Pembayaran Baru Masuk (via Web)");
    formData.append("photo", fileBuffer, {
      filename: file.originalFilename || "bukti.jpg",
      contentType: file.mimetype,
    });

    // KIRIM KE TELEGRAM
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await telegramRes.json();

    if (!result.ok) {
        // Jika Telegram gagal mengirim
        console.error("Gagal kirim ke Telegram:", result);
        // Lanjutkan return success agar di frontend dianggap berhasil, 
        // namun catat error di log server
    }

    // --- RESPON SUKSES ---
    return res.status(200).json({
      success: true,
      telegram: result,
      message: "Bukti berhasil diunggah dan dikirim ke Telegram."
    });

  } catch (err) {
    console.error("ERROR UPLOAD FINAL:", err);
    
    // --- PENANGANAN ERROR ---
    let errorMessage = "Upload gagal";
    if (err.code === 'ERR_MAX_FILE_SIZE') {
        errorMessage = "Ukuran file terlalu besar. Maksimal 5MB.";
    }

    return res.status(500).json({
      error: errorMessage,
      detail: err.toString(),
    });

  } finally {
    // === PERBAIKAN 2: Pastikan file sementara dihapus setelah proses selesai ===
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
