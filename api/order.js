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

      await db.collection("orders").add({
        name,
        phone,
        product,
        note,
        status: "Pending",
        tanggal: new Date().toISOString(),
        dibuat: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        success: true,
        message: "Order berhasil disimpan"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Gagal menyimpan order"
      });
    }
  } else {
    res.status(405).json({ message: "Method tidak diizinkan" });
  }
}
