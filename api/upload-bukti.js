// api/upload-bukti.js
// ... (Bagian import dan config)
// ...

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const uploadDir = "/tmp";

    const form = formidable({
      multiples: false,
      uploadDir,
      keepExtensions: true,
      filename: (name, ext, part) => { // Tambahkan 'part' untuk mendapatkan info yang lebih akurat
        return "bukti-" + Date.now() + ext;
      },
    });

    // PARSE FORM DATA
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // AMBIL OBJEK FILE YANG BENAR (mengatasi Formidable v3)
    const fileData = files.file;
    // Cek apakah fileData adalah array (kasus umum di Formidable v3) atau objek
    const file = Array.isArray(fileData) ? fileData[0] : fileData;


    if (!file || !file.filepath) {
      console.error("DEBUG: Objek file hasil parse:", file);
      // Jika error terjadi di sini, mungkin file terlalu besar atau upload gagal
      return res.status(400).json({ error: "File bukti pembayaran tidak ditemukan atau path tidak valid." });
    }
    
    // BARIS KRITIS: MEMBACA BUFFER DARI TEMPORARY PATH
    const fileBuffer = fs.readFileSync(file.filepath); // Baris yang tadinya error
    
    // ... (Sisa kode untuk Telegram)
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
    
    // ... (Sisa kode pengembalian sukses)
    const result = await telegramRes.json();

    // Hapus file sementara setelah selesai (penting di lingkungan serverless)
    fs.unlinkSync(file.filepath); 
    
    return res.status(200).json({
      success: true,
      telegram: result,
    });

  } catch (err) {
    console.error("ERROR UPLOAD FINAL:", err);
    return res.status(500).json({
      error: "Upload gagal",
      detail: err.toString(),
    });
  }
}
