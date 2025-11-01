export default async function handler(req, res) {
  try {
    const url = process.env.MOCKAPI_URL; // ambil dari Environment Variable

    const response = await fetch(url);
    if (!response.ok) throw new Error("Gagal ambil data dari MockAPI");

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Gagal memuat data produk",
      detail: err.message
    });
  }
}
