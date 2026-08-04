/** Open a printable tax invoice (browser → Save as PDF). No PDF library. */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inr(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(d || "");
  }
}

/**
 * @param {object} data - invoice payload from GET /orders/:id/invoice
 * @param {{ storeName?: string }} [opts]
 */
export function openInvoicePdf(data, opts = {}) {
  const store = opts.storeName || "Electronics Cart";
  const inv = data?.invoiceNumber || "INV";
  const addr = data?.billingAddress || {};
  const customer = data?.customer || {};
  const items = Array.isArray(data?.items) ? data.items : [];
  const rate = Number(data.gstRate) || 18;
  const total = Number(data.totalAmount) || 0;
  const explicitTax = Number(data.tax) || 0;
  // Prices are GST-inclusive (Flipkart-style): back-calculate when tax line is 0
  const gstAmount =
    explicitTax > 0 ? explicitTax : Math.round(((total * rate) / (100 + rate)) * 100) / 100;
  const taxable = Math.round((total - gstAmount) * 100) / 100;
  const pickup = String(data.pickupState || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const delivery = String(addr.state || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const sameState = pickup && delivery && pickup === delivery;
  const cgst = sameState ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const sgst = sameState ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const igst = sameState ? 0 : gstAmount;
  const halfRate = Math.round((rate / 2) * 100) / 100;

  const rows = items
    .map((it, i) => {
      const qty = Number(it.quantity || it.qty || 1);
      const price = Number(it.price) || 0;
      return `<tr>
        <td>${i + 1}</td>
        <td>${esc(it.name || "Item")}${data.hsn ? `<div class="muted">HSN ${esc(data.hsn)}</div>` : ""}</td>
        <td class="num">${qty}</td>
        <td class="num">${inr(price)}</td>
        <td class="num">${inr(price * qty)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(inv)} — ${esc(store)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, sans-serif; color: #111; margin: 0; padding: 32px; background: #f3f4f6; }
  .sheet { max-width: 720px; margin: 0 auto; background: #fff; padding: 40px 44px; box-shadow: 0 1px 8px rgba(0,0,0,.08); }
  h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.02em; }
  .muted { color: #667085; font-size: 12px; }
  .row { display: flex; justify-content: space-between; gap: 24px; margin-top: 28px; }
  .block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #667085; margin: 0 0 8px; }
  .block p { margin: 0; font-size: 13px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-top: 28px; font-size: 13px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #667085; border-bottom: 2px solid #111; padding: 8px 6px; }
  td { padding: 10px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .totals { margin-top: 16px; margin-left: auto; width: 280px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { font-weight: 700; font-size: 15px; border-top: 2px solid #111; margin-top: 8px; padding-top: 10px; }
  .actions { max-width: 720px; margin: 16px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
  .actions button { font: inherit; font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: 8px; border: 1px solid #d0d5dd; background: #fff; cursor: pointer; }
  .actions button.primary { background: #111; color: #fff; border-color: #111; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; max-width: none; padding: 0; }
    .actions { display: none !important; }
  }
</style>
</head>
<body>
  <div class="actions">
    <button type="button" onclick="window.close()">Close</button>
    <button type="button" class="primary" onclick="window.print()">Download PDF</button>
  </div>
  <div class="sheet">
    <h1>${esc(store)}</h1>
    <p class="muted">Tax Invoice${data.sellerGstin ? ` · GSTIN ${esc(data.sellerGstin)}` : ""}</p>
    <div class="row">
      <div class="block">
        <h3>Bill to</h3>
        <p><strong>${esc(addr.fullName || customer.name || "Customer")}</strong><br/>
        ${esc([addr.line1, addr.line2].filter(Boolean).join(", "))}<br/>
        ${esc([addr.city, addr.state].filter(Boolean).join(", "))} ${esc(addr.postalCode || "")}<br/>
        ${esc(addr.country || "India")}<br/>
        ${addr.phone ? `Phone: ${esc(addr.phone)}` : ""}${customer.email ? `<br/>Email: ${esc(customer.email)}` : ""}</p>
      </div>
      <div class="block" style="text-align:right">
        <h3>Invoice</h3>
        <p><strong>${esc(inv)}</strong><br/>
        Date: ${esc(fmtDate(data.issuedAt))}<br/>
        Payment: ${esc(data.paymentMethod || "—")} (${esc(data.paymentStatus || "—")})</p>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="5" class="muted">No items</td></tr>`}
      </tbody>
    </table>
    <div class="totals">
      <div><span class="muted">Subtotal</span><span>${inr(data.subtotal)}</span></div>
      ${Number(data.discount) ? `<div><span class="muted">Discount</span><span>-${inr(data.discount)}</span></div>` : ""}
      <div><span class="muted">Taxable value</span><span>${inr(taxable)}</span></div>
      ${
        sameState
          ? `<div><span class="muted">CGST (${halfRate}%)</span><span>${inr(cgst)}</span></div>
             <div><span class="muted">SGST (${halfRate}%)</span><span>${inr(sgst)}</span></div>`
          : `<div><span class="muted">IGST (${rate}%)</span><span>${inr(igst)}</span></div>`
      }
      ${Number(data.shippingFee) ? `<div><span class="muted">Shipping</span><span>${inr(data.shippingFee)}</span></div>` : ""}
      <div class="grand"><span>Total</span><span>${inr(data.totalAmount)}</span></div>
    </div>
    ${
      total >= 50000
        ? `<p class="muted" style="margin-top:20px">Note: Consignment value exceeds ₹50,000 — e-way bill is mandatory before dispatch.</p>`
        : ""
    }
    <p class="muted" style="margin-top:36px">Thank you for your purchase.</p>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=820,height=960");
  if (!w) throw new Error("Popup blocked — allow popups to download the invoice");
  w.document.open();
  w.document.write(html);
  w.document.close();
}
