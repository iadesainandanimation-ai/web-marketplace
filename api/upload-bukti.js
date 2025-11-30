// api/upload-bukti.js
const fetch = require("node-fetch"); // kalau Vercel Node 18+, fetch global bisa juga

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const { url } = req.body;

    // Kirim ke Telegram
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        photo: url,
        caption: "📸 Bukti pembayaran baru masuk"
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal kirim ke Telegram" });
  }
};
