import fs from 'fs/promises';
import * as fsSync from 'fs';
import { IncomingForm } from 'formidable';
import FormData from 'form-data';
import axios from 'axios'; // <-- IMPORT AXIOS

// Konfigurasi agar Vercel tahu ini adalah API endpoint kustom
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
  });

  let file; 

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // 1. Perbaikan Kunci File (Sesuai dengan frontend)
    file = files.file?.[0] || Object.values(files)[0];
    
    if (!file || !file.filepath) {
      console.error('File atau filepath tidak ditemukan dalam request.');
      return res.status(400).json({ success: false, message: 'File tidak ditemukan.' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
        console.error('Token atau Chat ID Telegram tidak terdeteksi di ENV.');
        return res.status(500).json({ success: false, message: 'Server error: Konfigurasi Telegram hilang.' });
    }

    // 2. Persiapan Data
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📸 Bukti Pembayaran Baru Masuk (via Web)");

    const fileBuffer = await fs.readFile(file.filepath); 

    formData.append("photo", fileBuffer, {
      filename: file.originalFilename || "bukti.jpg",
      contentType: file.mimetype,
    });
    
    // 3. Request Menggunakan AXIOS
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${botToken}/sendPhoto`;

    const telegramAxiosRes = await axios.post(
      TELEGRAM_API_URL,
      formData,
      {
        // PENTING: Axios secara otomatis menangani headers/body streaming lebih baik
        headers: formData.getHeaders(), 
      }
    );

    // Axios secara otomatis mengembalikan data JSON yang sudah diparse
    const result = telegramAxiosRes.data; 
    
    // Cek respons dari Telegram
    if (result.ok) {
        console.log("Berhasil kirim ke Telegram:", result);
    } else {
        console.error("Gagal kirim ke Telegram:", result);
    }

    res.status(200).json({ 
        success: result.ok, 
        message: result.ok ? 'Bukti pembayaran berhasil diunggah dan dikirim ke Telegram.' : 'Gagal mengirim gambar ke Telegram.',
        telegram_response: result,
    });

  } catch (error) {
    // Penanganan Error yang lebih baik dari Axios
    let errorMessage = 'Terjadi kesalahan pada server saat memproses file.';
    if (error.response) {
      // Error dari Telegram (400, 401, dll.)
      errorMessage = `Telegram API Error: Status ${error.response.status}. Pesan: ${JSON.stringify(error.response.data)}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Error saat memproses upload:', error);
    res.status(500).json({ success: false, message: errorMessage, error: errorMessage });
    
  } finally {
    if (file && file.filepath && fsSync.existsSync(file.filepath)) {
      try {
        await fs.unlink(file.filepath);
        console.log(`File sementara dihapus: ${file.filepath}`);
      } catch (e) {
        console.error("Gagal menghapus file sementara:", e);
      }
    }
  }
}

