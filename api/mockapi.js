export default async function handler(req, res) {
  try {
    // ganti URL di bawah ini sesuai MockAPI kamu
    const response = await fetch("https://68f37e06fd1a49fccc428f201.mockapi.io/products");
    if (!response.ok) throw new Error("MockAPI response error");

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Gagal mengambil data",
      detail: err.message
    });
  }
}
