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

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("buyer-name").value;
    const phone = document.getElementById("buyer-phone").value;
    const product = document.getElementById("product-name").value;
    const note = document.getElementById("buyer-note").value;

    const response = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, product, note })
    });

    const result = await response.json();

    if (!result.success) {
      alert("Gagal mengirim pesanan: " + result.error);
    }

    popup.style.display = "none";
    qrisPopup.style.display = "flex";
  });

  closePopup.addEventListener("click", function() {
    popup.style.display = "none";
  });

  closeQris.addEventListener("click", function() {
    qrisPopup.style.display = "none";
  });
});

// === Upload Bukti Pembayaran ===
document.addEventListener("DOMContentLoaded", () => {

  console.log("JS READY");
  console.log("buktiInput:", document.getElementById("bukti-transfer"));
  console.log("sendProofBtn:", document.getElementById("send-proof"));
  console.log("popupSuccess:", document.getElementById("popup-success"));

  const buktiInput = document.getElementById("bukti-transfer");
  const sendProofBtn = document.getElementById("send-proof");
  const popupSuccess = document.getElementById("popup-success");

  sendProofBtn.addEventListener("click", async () => {
    console.log("Tombol Kirim Bukti diklik");

    if (!buktiInput.files[0]) {
      alert("Silahkan upload bukti pembayaran dulu");
      return;
    }

    const file = buktiInput.files[0];
    const storageRef = firebase.storage().ref("bukti/" + Date.now() + "_" + file.name);
    await storageRef.put(file);
    const url = await storageRef.getDownloadURL();

    console.log("URL bukti:", url);

    await firebase.firestore().collection("buktiPembayaran").add({
      url: url,
      waktu: new Date()
    });

    await fetch("/api/upload-bukti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    document.getElementById("popup-qris").style.display = "none";
    popupSuccess.style.display = "flex";
  });
});
