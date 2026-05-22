export default async function handler(req, res) {
  // Pihak ketiga (Digiflazz/Tripay) biasanya mengirim laporan lewat method POST
  if (req.method === "POST") {
    try {
      const dataLaporan = req.body;

      // Sementara kita tampilkan dulu datanya di log server Vercel buat mastiin data masuk
      console.log("=== LAPORAN CALLBACK MASUK ===");
      console.log(JSON.stringify(dataLaporan, null, 2));

      // Berikan respon balik 200 OK ke Digiflazz/Tripay 
      // Ini WAJIB hukumnya, biar mereka tahu laporan mereka sudah kita terima
      return res.status(200).json({
        success: true,
        message: "Callback berhasil diterima oleh server web"
      });

    } catch (error) {
      console.error("Error di Callback:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  // Jika diakses biasa lewat browser (GET)
  return res.status(405).json({ message: "Method tidak diizinkan. Pintu ini khusus untuk laporan API." });
}

