export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const { url } = req.body;

    // Kirim ke Telegram
    const telegramRes = await fetch(
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

    // Debug kalau ingin cek status Telegram
    const data = await telegramRes.json();
    console.log("Telegram Response:", data);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("ERROR API UPLOAD BUKTI:", err);
    return res.status(500).json({ error: "Gagal kirim ke Telegram" });
  }
}
