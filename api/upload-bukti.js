// File: api/upload-bukti.js
export default async function handler(req, res) {
  console.log("Masuk API /upload-bukti"); // debug: cek request masuk

  if (req.method !== "POST") {
    console.log("Method tidak diizinkan:", req.method);
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const { url } = req.body;
    if (!url) {
      console.log("URL bukti tidak ada di body");
      return res.status(400).json({ error: "URL bukti diperlukan" });
    }

    console.log("URL bukti diterima:", url);

    // Kirim ke Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          photo: url,
          caption: "📸 Bukti pembayaran baru masuk"
        }),
      }
    );

    const telegramResult = await telegramResponse.json();
    console.log("Response Telegram:", telegramResult);

    if (!telegramResult.ok) {
      console.log("Gagal kirim ke Telegram:", telegramResult);
      return res.status(500).json({ error: "Gagal kirim ke Telegram" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error di /upload-bukti:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
