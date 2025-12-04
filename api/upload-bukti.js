import fs from 'fs/promises'; // Menggunakan API promises untuk operasi I/O asinkron
import * as fsSync from 'fs'; // Tetap butuh fs sinkron untuk existsSync di finally
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
    uploadDir: '/tmp', // Wajib menggunakan /tmp di lingkungan serverless Vercel
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // Maks 5MB
  });

  // Deklarasikan 'file' di scope terluar agar dapat diakses oleh blok 'finally'
  let file; 

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Ambil file yang pertama ditemukan
    file = files.bukti_pembayaran?.[0] || Object.values(files)[0];
    
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

    // 1. Buat objek FormData baru
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📸 Bukti Pembayaran Baru Masuk (via Web)");

    // 2. Baca seluruh file ke dalam Buffer (Operasi I/O yang lebih cepat dan aman dari timeout)
    const fileBuffer = await fs.readFile(file.filepath); 

    // 3. Tambahkan Buffer ke FormData
    formData.append("photo", fileBuffer, {
      filename: file.originalFilename || "bukti.jpg",
      contentType: file.mimetype,
    });
    
    // 4. Ambil Content-Type headers (dengan boundary)
    // Content-Length tidak diperlukan karena dikirim sebagai Buffer
    const formHeaders = formData.getHeaders();
    
    // 5. Lakukan Fetch ke API Telegram
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData,
        headers: formHeaders // Hanya Content-Type yang diperlukan
      }
    );

    const result = await telegramRes.json();
    
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
    console.error('Error saat memproses upload:', error);
    // Kembalikan error 500 ke klien
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat memproses file.', error: error.message });
  } finally {
    // Bagian ini sekarang menggunakan fs/promises.unlink
    if (file && file.filepath && fsSync.existsSync(file.filepath)) {
      try {
        await fs.unlink(file.filepath); // Gunakan fs/promises.unlink (await)
        console.log(`File sementara dihapus: ${file.filepath}`);
      } catch (e) {
        console.error("Gagal menghapus file sementara:", e);
      }
    }
  }
}
