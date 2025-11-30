export default async function handler(req, res) {
  console.log("== API /upload-bukti DIPANGGIL ==");

  if (req.method !== "POST") {
    console.log("Method bukan POST");
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const { url } = req.body;

    if (!url) {
      console.log("URL kosong");
      return res.status(400).json({ error: "URL tidak ada" });
    }

    const bot = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;

    console.log("BOT:", bot ? "ADA" : "KOSONG");
    console.log("CHAT:", chat ? "ADA" : "KOSONG");
    console.log("URL FOTO:", url);

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${bot}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat,
          photo: url,
          caption: "📸 Bukti pembayaran baru masuk"
        }),
      }
    );

    const teleResult = await telegramRes.json();
    console.log("HASIL TELEGRAM:", teleResult);

    if (!telegramRes.ok) {
      return res.status(500).json({ error: "Telegram tidak menerima foto" });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.log("ERROR:", err);
    return res.status(500).json({ error: "Gagal kirim ke Telegram" });
  }
}
