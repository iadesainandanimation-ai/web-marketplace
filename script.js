// ======================
// AMBIL DATA PRODUK
// ======================
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


// ======================
// FORM BELI
// ======================
function openPurchaseForm(item) {
  document.getElementById("product-name").value = item.Name;
  document.getElementById("popup").style.display = "flex";
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

  const form = document.querySelector("#popup form");
  const buktiInput = document.getElementById("bukti-transfer");
  const sendProofBtn = document.getElementById("send-proof");

  // Close buttons
  document.getElementById("close-popup").addEventListener("click", () => {
    popup.style.display = "none";
  });

  document.getElementById("close-qris").addEventListener("click", () => {
    qrisPopup.style.display = "none";
  });

  document.getElementById("close-success").addEventListener("click", () => {
    popupSuccess.style.display = "none";
  });



  // ======================
  // SUBMIT FORM (ISI DATA)
  // ======================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("Form pembelian disubmit!");

    const name = document.getElementById("buyer-name").value;
    const phone = document.getElementById("buyer-phone").value;
    const product = document.getElementById("product-name").value;
    const note = document.getElementById("buyer-note").value;

    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, product, note })
    });

    const result = await res.json();

    if (!result.success) {
      alert("Gagal mengirim pesanan: " + result.error);
      return;
    }

    popup.style.display = "none";
    qrisPopup.style.display = "flex";
  });



  // ======================
  // UPLOAD BUKTI BAYAR
  // ======================
  sendProofBtn.addEventListener("click", async () => {

    console.log("Tombol KIRIM BUKTI diklik");

    // Cek file
    if (!buktiInput.files[0]) {
      alert("Silahkan upload bukti pembayaran dulu");
      return;
    }

    const file = buktiInput.files[0];
    const fileName = Date.now() + "_" + file.name;

    console.log("Mulai upload:", fileName);

    // Upload ke Firebase
    const storageRef = firebase.storage().ref("bukti/" + fileName);
    await storageRef.put(file);
    const url = await storageRef.getDownloadURL();

    console.log("URL hasil upload:", url);

    // Simpan ke Firestore
    await firebase.firestore().collection("buktiPembayaran").add({
      url: url,
      waktu: new Date()
    });

    // Ping API → kirim ke Telegram
    await fetch("/api/upload-bukti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    // Tampilkan popup sukses
    qrisPopup.style.display = "none";
    popupSuccess.style.display = "flex";

  });

});
