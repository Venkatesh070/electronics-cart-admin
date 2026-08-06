/** Printable store invoice (browser → Save as PDF). Prices are tax-inclusive retail prices. */

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inr(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d || "—");
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return String(d || "—");
  }
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`.trim();
}

function threeDigits(n) {
  if (n < 100) return twoDigits(n);
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${twoDigits(n % 100)}` : ""}`;
}

/** Indian numbering: crore / lakh / thousand */
export function amountInWords(amount) {
  let n = Math.round(Number(amount) || 0);
  if (n === 0) return "Zero Rupees Only";
  const parts = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const rest = n;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return `${parts.join(" ")} Rupees Only`;
}

function addressLines(addr = {}) {
  return [
    addr.fullName,
    [addr.line1, addr.line2].filter(Boolean).join(", "),
    [addr.city, addr.state].filter(Boolean).join(", ") + (addr.postalCode ? `, ${addr.postalCode}` : ""),
    addr.country || "IN",
    addr.phone ? `Phone: ${addr.phone}` : "",
  ].filter(Boolean);
}

/** Make media paths work inside a blob: invoice tab. */
function absoluteMediaUrl(path) {
  if (!path) return `${window.location.origin}/favicon.svg`;
  if (/^(https?:|data:)/i.test(path)) return path;
  if (/^blob:/i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalized}`;
}

/**
 * Open a placeholder invoice tab synchronously (call inside the click handler,
 * before any await) so the browser does not block the popup.
 * Uses a blob URL so the address bar is not stuck on about:blank.
 * @returns {Window|null}
 */
export function openInvoiceWindow() {
  const placeholder = new Blob(
    [
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice</title></head>` +
        `<body style="font-family:Arial,sans-serif;padding:32px;color:#555">Preparing invoice…</body></html>`,
    ],
    { type: "text/html;charset=utf-8" }
  );
  const url = URL.createObjectURL(placeholder);
  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    return null;
  }
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  w.__invoiceBlobUrl = url;
  return w;
}

function showHtmlInWindow(html, target) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  let w = target && !target.closed ? target : null;

  if (w) {
    try {
      if (w.__invoiceBlobUrl) URL.revokeObjectURL(w.__invoiceBlobUrl);
    } catch {
      /* ignore */
    }
    try {
      w.location.replace(url);
      w.__invoiceBlobUrl = url;
      try {
        w.focus();
      } catch {
        /* ignore */
      }
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return w;
    } catch {
      // fall through
    }
  }

  w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked — allow popups for this site to view the invoice");
  }
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  w.__invoiceBlobUrl = url;
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return w;
}

/**
 * @param {object} data - invoice payload from GET /orders/:id/invoice
 * @param {{ storeName?: string; autoPrint?: boolean; target?: Window|null; logoUrl?: string }} [opts]
 */
export function openInvoicePdf(data, opts = {}) {
  if (!data || typeof data !== "object") {
    throw new Error("Invoice data is missing");
  }

  const store = opts.storeName || data.storeName || "Electronics Cart";
  const logoUrl = absoluteMediaUrl(opts.logoUrl || data.logo || data.logoUrl || "");
  const inv = data.invoiceNumber || `INV-${String(data.orderId || "").slice(-8).toUpperCase() || "XXXX"}`;
  const orderId = data.orderId || data.orderNumber || "—";
  const billTo = data.billingAddress || data.shippingAddress || {};
  const shipTo = data.shippingAddress || data.billingAddress || {};
  const customer = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const hsn = data.hsn || "84713000";
  const sellerAddress = data.sellerAddress || data.pickupAddress || "";
  const sellerPhone = data.sellerPhone || "";
  const pickupState = data.pickupState || data.sellerState || "";
  const deliveryState = shipTo.state || billTo.state || "";

  const subtotal = Number(data.subtotal) || 0;
  const discount = Number(data.discount) || 0;
  const shippingFee = Number(data.shippingFee) || 0;
  const total = Number(data.totalAmount) || 0;

  const rows = items
    .map((it, i) => {
      const qty = Number(it.quantity || it.qty || 1);
      const unitPrice = Number(it.price) || 0;
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;

      return `<tr>
        <td class="c">${i + 1}</td>
        <td>
          <div class="item-name">${esc(it.name || "Item")}</div>
          ${it.variantSku || it.variantLabel ? `<div class="muted">${esc(it.variantLabel || it.variantSku)}</div>` : ""}
          <div class="muted">HSN: ${esc(it.hsn || hsn)}</div>
        </td>
        <td class="num">${inr(unitPrice)}</td>
        <td class="c">${qty}</td>
        <td class="num"><strong>${inr(lineTotal)}</strong></td>
      </tr>`;
    })
    .join("");

  const itemsTotal =
    items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || it.qty || 1), 0) || subtotal;

  const billHtml = addressLines({
    ...billTo,
    fullName: billTo.fullName || customer.name || "Customer",
  })
    .map((line) => `${esc(line)}<br/>`)
    .join("");
  const shipHtml = addressLines({
    ...shipTo,
    fullName: shipTo.fullName || billTo.fullName || customer.name || "Customer",
  })
    .map((line) => `${esc(line)}<br/>`)
    .join("");

  const autoPrint = Boolean(opts.autoPrint);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(inv)} — Invoice</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 24px; background: #eaeded; font-size: 12px; }
  .sheet { max-width: 900px; margin: 0 auto; background: #fff; padding: 28px 32px 36px; border: 1px solid #ddd; }
  .center { text-align: center; }
  .brand { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 10px; }
  .brand img { height: 48px; width: auto; max-width: 160px; object-fit: contain; }
  .brand-name { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
  h1 { font-size: 18px; margin: 0 0 6px; font-weight: 700; }
  .muted { color: #555; font-size: 11px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; margin-bottom: 14px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px 20px; margin: 14px 0 18px; }
  .box p { margin: 0; line-height: 1.45; }
  .label { font-weight: 700; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #bbb; padding: 8px 8px; vertical-align: top; }
  th { background: #f3f3f3; font-size: 11px; text-align: left; }
  .c { text-align: center; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .item-name { font-weight: 600; margin-bottom: 2px; }
  .totals-wrap { display: flex; justify-content: flex-end; margin-top: 10px; }
  .totals { width: 300px; border: 1px solid #bbb; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #eee; }
  .totals div:last-child { border-bottom: 0; }
  .totals .grand { font-weight: 700; background: #f7f7f7; font-size: 13px; }
  .words { margin-top: 14px; font-size: 12px; }
  .foot { margin-top: 28px; display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; }
  .sign { text-align: right; padding-top: 40px; }
  .sign .line { border-top: 1px solid #111; display: inline-block; min-width: 180px; padding-top: 6px; font-size: 11px; }
  .note { margin-top: 18px; font-size: 10px; color: #555; line-height: 1.4; }
  .actions { max-width: 900px; margin: 0 auto 12px; display: flex; gap: 8px; justify-content: flex-end; }
  .actions button { font: inherit; font-size: 13px; font-weight: 600; padding: 9px 14px; border-radius: 6px; border: 1px solid #888; background: #fff; cursor: pointer; }
  .actions button.primary { background: #ffd814; border-color: #fcd200; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { border: 0; max-width: none; }
    .actions { display: none !important; }
  }
  @media (max-width: 720px) {
    .grid-2, .grid-3, .foot { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <div class="actions">
    <button type="button" onclick="window.close()">Close</button>
    <button type="button" class="primary" onclick="window.print()">Download / Print PDF</button>
  </div>
  <div class="sheet">
    <div class="brand">
      <img src="${esc(logoUrl)}" alt="${esc(store)}" onerror="this.style.display='none'"/>
      <div class="brand-name">${esc(store)}</div>
    </div>
    <h1 class="center">Invoice</h1>
    <div class="center muted" style="margin-bottom:16px">(Original for Recipient)</div>

    <div class="grid-2">
      <div class="box">
        <div class="label">Sold By :</div>
        <p>
          <strong>${esc(store)}</strong><br/>
          ${sellerAddress ? `${esc(sellerAddress)}<br/>` : ""}
          ${pickupState ? `${esc(pickupState)}, IN<br/>` : ""}
          ${sellerPhone ? `Phone: ${esc(sellerPhone)}` : ""}
        </p>
      </div>
      <div class="box">
        <div class="label">Billing Address :</div>
        <p>${billHtml || "—"}</p>
      </div>
      <div class="box">
        <div class="label">Shipping Address :</div>
        <p>${shipHtml || "—"}</p>
      </div>
      <div class="box">
        <div class="label">Order details</div>
        <p>
          <strong>Order Number:</strong> ${esc(orderId)}<br/>
          <strong>Order Date:</strong> ${esc(fmtDate(data.orderDate || data.issuedAt))}<br/>
          <strong>Invoice Number:</strong> ${esc(inv)}<br/>
          <strong>Invoice Date:</strong> ${esc(fmtDate(data.issuedAt))}<br/>
          <strong>Payment:</strong> ${esc(data.paymentMethod || "—")} (${esc(data.paymentStatus || "—")})
        </p>
      </div>
    </div>

    <div class="grid-3">
      <div><span class="muted">Place of supply:</span> <strong>${esc(deliveryState || pickupState || "—")}</strong></div>
      <div><span class="muted">Place of delivery:</span> <strong>${esc(deliveryState || "—")}</strong></div>
      <div><span class="muted">Prices:</span> <strong>Inclusive of all taxes</strong></div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="c" style="width:36px">Sl.<br/>No</th>
          <th>Description</th>
          <th class="num" style="width:110px">Unit Price</th>
          <th class="c" style="width:56px">Qty</th>
          <th class="num" style="width:120px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="5" class="muted">No items</td></tr>`}
        <tr>
          <td colspan="4" class="num"><strong>TOTAL:</strong></td>
          <td class="num"><strong>${inr(total || itemsTotal)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="totals-wrap"><div class="totals">
      <div><span>Subtotal</span><span>${inr(subtotal || itemsTotal)}</span></div>
      ${discount > 0 ? `<div><span>Discount</span><span>-${inr(discount)}</span></div>` : ""}
      ${shippingFee > 0 ? `<div><span>Shipping</span><span>${inr(shippingFee)}</span></div>` : `<div><span>Shipping</span><span>FREE</span></div>`}
      <div class="grand"><span>Invoice Total</span><span>${inr(total)}</span></div>
    </div></div>

    <p class="words"><strong>Amount in Words:</strong> ${esc(amountInWords(total))}</p>

    <div class="foot">
      <div class="note">
        <strong>Declaration</strong><br/>
        We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
        Prices are inclusive of all applicable taxes.
      </div>
      <div class="sign">
        <div class="line">For ${esc(store)}:<br/>Authorised Signatory</div>
      </div>
    </div>

    <p class="muted center" style="margin-top:28px">Thank you for shopping with us!</p>
    <p class="muted center">Please retain this invoice for warranty / returns.</p>
  </div>
  <script>
    ${
      autoPrint
        ? `window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 300); });`
        : ""
    }
  </script>
</body>
</html>`;

  return showHtmlInWindow(html, opts.target || null);
}
