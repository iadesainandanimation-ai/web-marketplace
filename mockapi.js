export default async function handler(req, res) {
  try {
    const response = await fetch("https://68f37e60fd14a9fcc428f201.mockapi.io/products");
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data", detail: err.message });
  }
}
