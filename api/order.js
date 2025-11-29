import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { name, phone, product, note } = req.body;

      // Simpan ke Firestore
      await db.collection("orders").add({
        name,
        phone,
        product,
        note,
        status: "Pending",
        tanggal: new Date().toISOString(),
        dibuat: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ===== Kirim ke Telegram =====
      const message = `
🛒 *Order Baru Masuk*
Nama: ${name}
No HP: ${phone}
Produk: ${product}
Catatan: ${note || "-"}
Tanggal: ${new Date().toLocaleString("id-ID")}
      `;

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      });

      // Respon sukses
      return res.status(200).json({
        success: true,
        message: "Order berhasil disimpan dan dikirim ke Telegram",
      });

    } catch (error) {
      console.error("ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan order",
      });
    }
  }

  // Jika method selain POST
  return res.status(405).json({ message: "Method tidak diizinkan" });
}
