import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { nama, noHp, produk } = req.body;

      // Simpan ke Firestore
      await addDoc(collection(db, "orders"), {
        nama,
        noHp,
        produk,
        status: "Pending",
        tanggal: new Date().toISOString(),
        dibuat: serverTimestamp()
      });

      res.status(200).json({ success: true, message: "Order berhasil disimpan" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Gagal menyimpan order" });
    }
  } else {
    res.status(405).json({ message: "Metode tidak diizinkan" });
  }
}
