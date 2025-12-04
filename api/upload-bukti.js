import fs from 'fs';
import { IncomingForm } from 'formidable';
import FormData from 'form-data';

// Konfigurasi agar Vercel tahu ini adalah API endpoint kustom
export const config = {
  api: {
    bodyParser: false, // Penting: nonaktifkan body parser default untuk menangani form data
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = new IncomingForm({
    uploadDir: './tmp',
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // Maks 5MB
  });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.bukti_pembayaran?.[0] || Object.values(files)[0];
    
    if (!file) {
      console.error('File tidak ditemukan dalam request.');
      return res.status(400).json({ success: false, message: 'File tidak ditemukan.' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
        console.error('Token atau Chat ID Telegram tidak terdeteksi di ENV.');
        // Beri respons 500 karena ini masalah konfigurasi server
        return res.status(500).json({ success: false, message: 'Server error: Konfigurasi Telegram hilang.' });
    }

    // 1. Buat objek FormData baru
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📸 Bukti Pembayaran Baru Masuk (via Web)");

    // 2. Tambahkan file sebagai Stream
    const fileStream = fs.createReadStream(file.filepath); 

    formData.append("photo", fileStream, {
      filename: file.originalFilename || "bukti.jpg",
      contentType: file.mimetype,
    });
    
    // 3. Ambil Content-Type headers (dengan boundary)
    const formHeaders = formData.getHeaders();
    
    // 4. Ambil Content-Length secara asinkron (KRUSIAL)
    const contentLength = await new Promise((resolve, reject) => {
        formData.getLength((err, length) => {
            if (err) reject(err);
            resolve(length);
        });
    });
    
    // 5. Lakukan Fetch ke API Telegram dengan headers yang dikalkulasi
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData,
        // Gabungkan semua headers (terutama Content-Type dan Content-Length)
        headers: {
            ...formHeaders,
            'Content-Length': contentLength,
        }
      }
    );

    const result = await telegramRes.json();
    
    // Cek respons dari Telegram
    if (result.ok) {
        console.log("Berhasil kirim ke Telegram:", result);
    } else {
        console.error("Gagal kirim ke Telegram:", result);
        // Tetap kembalikan respons 200 ke klien jika ini adalah kegagalan Telegram (Bad Request),
        // namun log error-nya secara detail di sisi server.
        // Anda bisa memilih status 500 di sini jika ingin klien tahu ada masalah serius.
        // Untuk saat ini, kita anggap pengunggahan ke server sukses.
    }

    res.status(200).json({ 
        success: result.ok, 
        message: result.ok ? 'Bukti pembayaran berhasil diunggah dan dikirim ke Telegram.' : 'Gagal mengirim gambar ke Telegram.',
        telegram_response: result,
    });

  } catch (error) {
    console.error('Error saat memproses upload:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat memproses file.', error: error.message });
  } finally {
    // Pastikan file sementara dihapus di akhir
    if (file && fs.existsSync(file.filepath)) {
      try {
        fs.unlinkSync(file.filepath);
        console.log(`File sementara dihapus: ${file.filepath}`);
      } catch (e) {
        console.error("Gagal menghapus file sementara:", e);
      }
    }
  }
}
