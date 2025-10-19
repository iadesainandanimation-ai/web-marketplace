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
      card.querySelector("button").addEventListener("click", () => {
        openPurchaseForm(item); // ganti dengan fungsi buka form pembelian
      });
      container.appendChild(card);
    });
  })
  .catch(err => {
    console.error("Gagal memuat data:", err);
    document.querySelector("#product-list").innerHTML =
      "<p style='color:red;'>Gagal memuat data produk.</p>";
  });
const popup = document.getElementById("popup");
const closePopup = document.getElementById("close-popup");
const productInput = document.getElementById("product-name");
const orderForm = document.getElementById("order-form");

closePopup.addEventListener("click", () => {
  popup.style.display = "none";
});

orderForm.addEventListener("submit", e => {
  e.preventDefault();
  alert("Data berhasil dikirim! (nanti diarahkan ke Tripay)");
  popup.style.display = "none";
});

// munculkan popup ketika klik “Beli Sekarang”
document.addEventListener("click", e => {
  if (e.target.tagName === "BUTTON" && e.target.textContent === "Beli Sekarang") {
    const productName = e.target.parentElement.querySelector("h3").textContent;
    productInput.value = productName;
    popup.style.display = "flex";
  }
});
