// === Ambil data produk ===
fetch("/api/mockapi")
  .then(res => res.json())
  .then(data => {
    const container = document.querySelector("#product-list");
    container.innerHTML = "";

    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "product";
      card.innerHTML = `
        <h3>${item.Name}</h3>
        <p>Harga: Rp${item.Price}</p>
        <p>Stok: ${item.Stock}</p>
        <button>Beli Sekarang</button>
      `;
      card.querySelector("button").addEventListener("click", () => openPurchaseForm(item));
      container.appendChild(card);
    });
  })
  .catch(err => {
    console.error("Gagal memuat data:", err);
    document.querySelector("#product-list").innerHTML =
      "<p style='color:red;'>Gagal memuat data produk.</p>";
  });

// === Fungsi Buka Form ===
function openPurchaseForm(item) {
  const popup = document.getElementById("popup");
  const productInput = document.getElementById("product-name");
  productInput.value = item.Name;
  popup.style.display = "flex";
}

// === Pop-up Form & QRIS ===
document.addEventListener("DOMContentLoaded", function() {
  const form = document.querySelector("#popup form");
  const popup = document.getElementById("popup");
  const qrisPopup = document.getElementById("popup-qris");
  const closePopup = document.getElementById("close-popup");
  const closeQris = document.getElementById("close-qris");

  // Saat form disubmit
  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("buyer-name").value;
    const phone = document.getElementById("buyer-phone").value;
    const product = document.getElementById("product-name").value;
    const note = document.getElementById("buyer-note").value;

    // kirim data ke backend
    const response = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, product, note })
    });

    const result = await response.json();

    if (result.success) {
      alert("Pesanan berhasil dikirim ke Firebase!");
    } else {
      alert("Gagal mengirim pesanan: " + result.error);
    }

    // tetap tampilkan popup QRIS
    popup.style.display = "none";
    qrisPopup.style.display = "flex";
  });

  // Tombol Batal di form
  closePopup.addEventListener("click", function() {
    popup.style.display = "none";
  });

  // Tombol Tutup di QRIS
  closeQris.addEventListener("click", function() {
    qrisPopup.style.display = "none";
  });
});
