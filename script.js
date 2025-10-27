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
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    alert("Silakan bayar lewat QRIS sesuai nominal.");
    popup.style.display = "none";
    qrisPopup.style.display = "flex"; // langsung munculkan QRIS popup
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
