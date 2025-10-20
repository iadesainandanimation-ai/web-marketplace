// /api/tripay.js  (untuk Vercel serverless - Node 18+)
// menggunakan native fetch agar lebih portable (pastikan runtime Node 18+ di Vercel)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 1) cek env
  const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY;
  if (!TRIPAY_API_KEY) {
    console.error("Missing TRIPAY_API_KEY env var");
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    // 2) validasi body
    const { method, amount, name, email, phone, productSku, productName } = req.body ?? {};

    if (!method || !amount || !name || !phone || !productName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // basic type checks
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > 1000000000) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (typeof phone !== "string" && typeof phone !== "number") {
      return res.status(400).json({ error: "Invalid phone" });
    }

    // 3) buat merchant_ref unik (gabungan waktu + random) — cukup aman & unik
    const merchant_ref = `INV-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    // 4) optional: simpan order dulu ke MockAPI (untuk tracking)
    // Jika mau: uncomment dan set ORDERS_API_URL ke env; jangan simpan sensitive keys di body.
    /*
    if (process.env.ORDERS_API_URL) {
      try {
        await fetch(process.env.ORDERS_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant_ref,
            productName,
            productSku,
            amount: amountNum,
            name, phone, email,
            status: "pending",
            created_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn("Failed to save order to ORDERS_API_URL:", err?.message || err);
      }
    }
    */

    // 5) siapkan body request ke Tripay (sesuaikan field dgn doc Tripay sandbox/prod)
    const tripayBody = {
      method, // misal "QRIS" atau "BRIVA" — pilih sesuai input user
      merchant_ref,
      amount: amountNum,
      customer_name: name,
      customer_email: email || "",
      customer_phone: phone.toString(),
      order_items: [
        { sku: productSku || "SKU-UNKNOWN", name: productName, price: amountNum, quantity: 1 }
      ],
      callback_url: `https://${req.headers.host}/api/tripay-webhook`, // pastikan url ini ter-allow di Tripay
      // return_url: `https://${req.headers.host}/payment-return` // opsional
    };

    // 6) panggil Tripay (sandbox URL dipakai untuk test; ganti ke production endpoint saat live)
    const tripayUrl = "https://tripay.co.id/api-sandbox/transaction/create"; // cek dokumentasi

    const tripayResp = await fetch(tripayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TRIPAY_API_KEY}`
      },
      body: JSON.stringify(tripayBody),
    });

    const tripayData = await tripayResp.json();

    // 7) safety: jangan return seluruh object mentah kalau berisi sensitive info
    if (!tripayResp.ok) {
      // log terbatas untuk debugging
      console.error("Tripay error:", tripayData);
      return res.status(502).json({ error: "Payment gateway error", detail: tripayData?.message || tripayData });
    }

    // success -> kembalikan data penting ke client (mis: checkout_url)
    return res.status(200).json({
      success: true,
      merchant_ref,
      data: tripayData?.data ?? tripayData
    });

  } catch (err) {
    console.error("Server error create-payment:", err?.message || err);
    return res.status(500).json({ error: "Internal server error" });
  }
      }
