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
      // 1. Tangkap ref_id dari req.body yang dikirim frontend
      const { ref_id, name, phone, product, note } = req.body;

      // 2. Simpan ke Firestore (Tambahkan ref_id ke dalam object)
      await db.collection("orders").add({
        ref_id: ref_id || "TANPA-REF-ID", // Jaga-jaga kalau frontend gak ngirim
        name,
        phone,
        product,
        note,
        status: "Pending",
        tanggal: new Date().toISOString(),
        dibuat: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ===== 3. Kirim ke Telegram (Kita bikin makin rapi pake Ref-ID) =====
      const message = `
✨ *ORDER BARU MASUK* ✨
-----------------------------
🆔 *Ref-ID:* \`${ref_id}\`
👤 *Nama:* ${name}
📱 *No HP:* ${phone}
📦 *Produk:* ${product}
📝 *Catatan:* ${note || "-"}
📅 *Tanggal:* ${new Date().toLocaleString("id-ID")}
🚦 *Status:* PENDING
-----------------------------
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
