const generateRefID = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${date}`;
    
    const randomNum = Math.floor(1000 + Math.random() * 9000); 
    return `PPOB-${dateStr}-${randomNum}`;
};

// ======================
// AMBIL DATA PRODUK
// ======================
fetch("/api/mockapi")
  .then(res => res.json())
  .then(data => {
    const container = document.querySelector("#product-list");
    if (!container) return;
    
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
    const container = document.querySelector("#product-list");
    if (container) {
      container.innerHTML = "<p style='color:red;'>Gagal memuat data produk.</p>";
    }
  });


// ======================
// FORM BELI
// ======================
function openPurchaseForm(item) {
  const productNameInput = document.getElementById("product-name");
  const popup = document.getElementById("popup");
  
  if (productNameInput && popup) {
    productNameInput.value = item.Name;
    popup.style.display = "flex";
  }
}


// ========================
// SEMUA EVENT LISTENER DISINI
// ========================
document.addEventListener("DOMContentLoaded", () => {

  console.log("JS READY (ALL LISTENER ACTIVE)");

  // Element penting
  const popup = document.getElementById("popup");
  const qrisPopup = document.getElementById("popup-qris");
  const popupSuccess = document.getElementById("popup-success");
  const form = document.getElementById("orderForm"); // 🟢 Disamakan dengan ID di HTML kamu!

  // Amankan jika close button dicari
  document.getElementById("close-popup")?.addEventListener("click", () => {
    if (popup) popup.style.display = "none";
  });

  document.getElementById("close-qris")?.addEventListener("click", () => {
    if (qrisPopup) qrisPopup.style.display = "none";
  });

  document.getElementById("close-success")?.addEventListener("click", () => {
    if (popupSuccess) popupSuccess.style.display = "none";
  });


  // ======================
  // SUBMIT FORM (ISI DATA)
  // ======================
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      console.log("Form pembelian disubmit!");

      const name = document.getElementById("buyer-name").value;
      const phone = document.getElementById("buyer-phone").value;
      const product = document.getElementById("product-name").value;
      const note = document.getElementById("buyer-note").value;

      // 1. Bikin Ref-ID unik otomatis
      const currentRefID = generateRefID();

      // 2. Kirim data ke backend asli kamu (/api/order)
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ref_id: currentRefID, 
          name, 
          phone, 
          product, 
          note,
          status: "Pending"     
        })
      });

      const result = await res.json();

      // 3. Cek apakah pengiriman data sukses
      if (!result.success) {
        alert("Gagal mengirim pesanan: " + result.error);
        return;
      }

      // 4. Sembunyikan form input, lalu munculkan pop-up QRIS
      if (popup) popup.style.display = "none";
      if (qrisPopup) qrisPopup.style.display = "flex";

      // 5. SAKLAR TOMBOL WHATSAPP (Langsung aktif di sini)
      const btnWaConfirm = document.getElementById("btn-wa-confirm");
      if (btnWaConfirm) {
        // Reset listener biar gak dobel pas pembeli nge-klik berulang kali
        const newBtn = btnWaConfirm.cloneNode(true);
        btnWaConfirm.parentNode.replaceChild(newBtn, btnWaConfirm);
        
        // Jalankan aksi kirim pesan saat tombol diklik
        newBtn.addEventListener("click", () => {
          const nomorAdmin = "62895700985606"; // Nomor WA kamu aman
          const teksPesan = `Halo Admin, saya sudah melakukan pembayaran.%0A%0A` +
                            `🆔 *Ref-ID:* ${currentRefID}%0A` +
                            `📦 *Produk:* ${product}%0A%0A` +
                            `Berikut saya lampirkan bukti transfernya ya min.`;

          window.open(`https://wa.me/${nomorAdmin}?text=${teksPesan}`, '_blank');
          
          // Setelah dialihkan ke WA, otomatis web pindah ke popup sukses/terima kasih
          if (qrisPopup) qrisPopup.style.display = "none";
          if (popupSuccess) popupSuccess.style.display = "flex";
        });
      }
    });
  }
});
            
