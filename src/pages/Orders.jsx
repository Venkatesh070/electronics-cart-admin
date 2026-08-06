import { useState } from "react";
import { Check, Download, Printer, RefreshCw, Truck, XCircle } from "lucide-react";
import { ordersApi, settingsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, formatINR, nameOf, ORDER_STATUS_API, ORDER_STATUS_LABEL, titleCase } from "../utils/format";
import { Badge, Button, Card, Drawer, ErrorState, Field, inputCls, LoadingState, PageHeader, SearchInput, Select, Table } from "../components/ui";
import StatusDot from "../components/StatusDot";
import { openInvoicePdf, openInvoiceWindow } from "../utils/invoicePdf";

const STAGES = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

function mapOrder(o) {
  const fullId = o._id || o.id;
  const paymentStatus = String(o.paymentStatus || "pending").toLowerCase();
  return {
    ...o,
    backendId: fullId,
    id: `#${String(fullId).slice(-8).toUpperCase()}`,
    customer: nameOf(o.user),
    city: o.shippingAddress?.city || "—",
    amount: Number(o.totalAmount) || 0,
    status: ORDER_STATUS_LABEL[o.status] || titleCase(o.status),
    apiStatus: o.status,
    payment: o.paymentMethod || "—",
    paymentStatus,
    razorpayRefundId: o.razorpayRefundId || "",
    razorpayPaymentId: o.razorpayPaymentId || "",
    refundedAt: o.refundedAt || null,
    date: formatDate(o.createdAt),
    shippingPhone: o.shippingAddress?.phone || "",
    items: (o.items || []).map((it) => ({
      name: nameOf(it.product, it.name || "Product"),
      qty: it.quantity || it.qty || 1,
      price: Number(it.price) || 0,
    })),
    awb: o.tracking?.trackingId || o.shiprocket?.awb,
    shiprocketId: o.shiprocket?.orderId,
    labelUrl: o.shiprocket?.labelUrl,
  };
}

function paymentStatusBadge(order) {
  const pay = String(order.paymentStatus || "").toLowerCase();
  if (pay === "refunded") return <Badge tone="success">Refund initiated</Badge>;
  if (order.apiStatus === "cancelled" && pay === "paid") return <Badge tone="amber">Refund pending</Badge>;
  if (pay === "paid") return <Badge tone="success">Paid</Badge>;
  if (pay === "failed") return <Badge tone="danger">Failed</Badge>;
  if (order.apiStatus === "cancelled") return <Badge tone="neutral">No refund</Badge>;
  return <Badge tone="neutral">{titleCase(pay || "pending")}</Badge>;
}

function openUrl(url) {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

export default function Orders() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [payment, setPayment] = useState("All");
  const [active, setActive] = useState(null);
  const [busy, setBusy] = useState("");
  const apiStatus = status === "All" ? "" : ORDER_STATUS_API[status] || status;
  const { data, error, loading, reload } = useAsync(async () => (await ordersApi.list({ limit: 50, status: apiStatus, search: q })).data || [], [apiStatus, q]);
  const orders = (data || []).map(mapOrder);
  const rows = orders.filter((o) => payment === "All" || o.payment === payment);

  async function setOrderStatus(order, nextStatus) {
    try {
      const apiValue = ORDER_STATUS_API[nextStatus] || nextStatus;
      const res = await ordersApi.updateStatus(order.backendId, { status: apiValue });
      const updated = res?.data;
      if (updated) {
        const mapped = mapOrder(updated);
        setActive((a) => (a && a.backendId === order.backendId ? mapped : a));
        if (apiValue === "cancelled") {
          if (mapped.paymentStatus === "refunded") {
            alert("Order cancelled. Refund initiated via payment gateway.");
          } else if (res?.refund?.error) {
            alert(`Order cancelled, but refund failed: ${res.refund.error}`);
          } else if (res?.refund?.skipped) {
            alert(`Order cancelled. Refund: ${res.refund.skipped}`);
          }
        }
      } else {
        setActive((a) =>
          a
            ? {
                ...a,
                status: ORDER_STATUS_LABEL[apiValue] || titleCase(apiValue),
                apiStatus: apiValue,
              }
            : a
        );
      }
      await reload();
    } catch (e) {
      alert(e?.message || "Could not update order");
    }
  }
  async function invoice(order) {
    const win = openInvoiceWindow();
    if (!win) {
      alert("Allow popups to view the invoice");
      return;
    }
    try {
      const res = await ordersApi.invoice(order.backendId);
      openInvoicePdf(res.data || {}, { storeName: "Electronics Cart", target: win, autoPrint: false });
    } catch (e) {
      try {
        win.close();
      } catch {
        /* ignore */
      }
      alert(e?.message || "Could not load invoice");
    }
  }
  async function shipRocket(order, force = false) {
    setBusy(force ? "force" : "ship");
    try {
      let phone;
      const existingDigits = String(order.shippingPhone || "").replace(/\D/g, "").slice(-10);
      if (existingDigits.length < 10) {
        const entered = window.prompt(
          "Shipping phone (10 digits) is required for Shiprocket.\nEnter customer mobile number:",
          order.shippingPhone || ""
        );
        if (entered === null) return;
        phone = entered.replace(/\D/g, "").slice(-10);
        if (phone.length < 10) {
          alert("Enter a valid 10-digit phone number");
          return;
        }
      }

      let sellerGstin;
      if (order.amount >= 50000) {
        let savedGstin = "";
        try {
          savedGstin = ((await settingsApi.get()).data || {}).sellerGstin || "";
        } catch {
          /* ignore */
        }
        if (!savedGstin) {
          const entered = window.prompt(
            "Order is over ₹50,000 — seller GSTIN is required for Shiprocket.\nEnter your 15-character GSTIN (saved in System Settings):",
            ""
          );
          if (entered === null) return;
          sellerGstin = entered.trim().toUpperCase();
          if (sellerGstin.length < 15) {
            alert("Enter a valid 15-character GSTIN");
            return;
          }
        } else {
          sellerGstin = String(savedGstin).trim().toUpperCase();
        }
      }

      let ewaybillNo;
      if (order.amount >= 50000) {
        const entered = window.prompt(
          "E-way bill number (optional now — paste if you already have one, or leave blank):",
          order.shiprocket?.ewaybillNo || ""
        );
        if (entered === null) return;
        ewaybillNo = entered.trim();
      }
      const res = await ordersApi.shiprocket(order.backendId, {
        force: force || undefined,
        ewaybillNo: ewaybillNo || undefined,
        phone: phone || undefined,
        sellerGstin: sellerGstin || undefined,
      });
      const updated = mapOrder(res.data || {});
      setActive((a) => (a ? { ...a, ...updated } : updated));
      await reload();
      alert(updated.awb ? `Shiprocket OK · AWB ${updated.awb}` : "Pushed to Shiprocket with GST/HSN. Assign courier / upload e-way bill if still required.");
    } catch (e) {
      alert(e?.message || "Shiprocket failed");
    } finally {
      setBusy("");
    }
  }
  async function syncRocket(order) {
    setBusy("sync");
    try {
      const res = await ordersApi.syncShiprocket(order.backendId);
      const updated = mapOrder(res.data || {});
      setActive((a) => (a ? { ...a, ...updated } : updated));
      await reload();
      alert(updated.awb ? `Synced · AWB ${updated.awb}` : "Synced — AWB still missing (finish Ship Now in Shiprocket)");
    } catch (e) {
      alert(e?.message || "Sync failed");
    } finally {
      setBusy("");
    }
  }
  async function downloadLabel(order) {
    setBusy("label");
    try {
      const res = await ordersApi.shiprocketLabel(order.backendId);
      openUrl(res.data?.url);
      await reload();
    } catch (e) {
      alert(e?.message || "Label not ready — complete Ship Now in Shiprocket first");
    } finally {
      setBusy("");
    }
  }
  async function downloadSrInvoice(order) {
    setBusy("srInvoice");
    try {
      const res = await ordersApi.shiprocketInvoice(order.backendId);
      openUrl(res.data?.url);
    } catch (e) {
      alert(e?.message || "Shiprocket invoice not ready");
    } finally {
      setBusy("");
    }
  }
  if (loading && !data) return <LoadingState label="Loading orders…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return <div>
    <PageHeader eyebrow="Sales" title="Orders" description={`${orders.length} orders. Filter, update status, and print invoices.`} />
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search order ID or customer…" />
        <Select value={status} onChange={setStatus} options={["All", ...STAGES, "Cancelled"]} />
        <Select value={payment} onChange={setPayment} options={["All", "UPI", "Card", "Net Banking", "COD", "EMI"]} />
      </div>
      <Table rows={rows} empty="No orders found." onRowClick={setActive} columns={[
        { key: "id", label: "Order ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
        { key: "customer", label: "Customer", render: (r) => <div><div className="font-medium">{r.customer}</div><div className="text-xs text-muted">{r.city}</div></div> },
        { key: "date", label: "Date", render: (r) => <span className="font-mono text-xs text-muted">{r.date}</span> },
        {
          key: "payment",
          label: "Payment",
          render: (r) => (
            <div className="flex flex-col gap-1 items-start">
              <span className="text-sm">{r.payment}</span>
              {paymentStatusBadge(r)}
            </div>
          ),
        },
        { key: "amount", label: "Amount", render: (r) => <span className="font-mono">{formatINR(r.amount)}</span> },
        { key: "status", label: "Status", render: (r) => <StatusDot status={r.status} /> },
      ]} />
    </Card>
    <Drawer open={!!active} onClose={() => setActive(null)} title={active?.id}>
      {active && <div>
        <div className="flex items-center justify-between mb-5"><div><div className="font-medium text-ink">{active.customer}</div><div className="text-xs text-muted">{active.city} · {active.payment}{active.shippingPhone ? ` · ${active.shippingPhone}` : ""}</div></div>
          <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => invoice(active)}><Printer size={13} /> Invoice</Button>
            {!["Cancelled", "Delivered"].includes(active.status) && <Button size="sm" variant="danger" onClick={() => setOrderStatus(active, "Cancelled")}><XCircle size={13} /> Cancel</Button>}
          </div>
        </div>
        {active.status !== "Cancelled" ? <div className="mb-6">
          <div className="text-xs font-medium text-muted mb-3">DELIVERY TIMELINE</div>
          <div className="flex items-center">{STAGES.map((stage, i) => { const reached = STAGES.indexOf(active.status) >= i; return <div key={stage} className="flex-1 flex flex-col items-center relative">
            {i > 0 && <div className={`absolute right-1/2 top-2.5 h-0.5 w-full ${reached ? "bg-primary" : "bg-border"}`} />}
            <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${reached ? "bg-primary text-white" : "bg-white border-2 border-border"}`}>{reached && <Check size={11} />}</div>
            <span className={`text-[10px] mt-1.5 text-center ${reached ? "text-ink font-medium" : "text-muted"}`}>{stage}</span>
          </div>; })}</div>
          <Field label="Update status"><select className={inputCls} value={active.status} onChange={(e) => setOrderStatus(active, e.target.value)}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <div className="mt-3 p-3 rounded-md border border-border bg-white">
            <div className="text-xs font-medium text-muted mb-1">SHIPROCKET</div>
            <div className="text-sm text-ink mb-2">
              {active.awb ? <>AWB <span className="font-mono">{active.awb}</span></> : active.shiprocketId ? <>Order #{active.shiprocketId} (assign AWB in Shiprocket)</> : "Not pushed yet"}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={!!busy || !!active.shiprocketId} onClick={() => shipRocket(active)}>
                <Truck size={13} /> {busy === "ship" ? "Pushing…" : active.shiprocketId ? "Already on Shiprocket" : "Ship with Shiprocket"}
              </Button>
              {active.shiprocketId && (
                <>
                  <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => syncRocket(active)}>
                    <RefreshCw size={13} /> {busy === "sync" ? "Syncing…" : "Sync AWB"}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => shipRocket(active, true)}>
                    <Truck size={13} /> {busy === "force" ? "…" : "Re-push GST"}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => downloadLabel(active)}>
                    <Download size={13} /> {busy === "label" ? "…" : "Label"}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => downloadSrInvoice(active)}>
                    <Download size={13} /> {busy === "srInvoice" ? "…" : "SR Invoice"}
                  </Button>
                </>
              )}
            </div>
            {active.amount >= 50000 && (
              <p className="text-[11px] text-muted mt-2">
                Over ₹50k: GST/HSN are sent automatically. Generate e-way bill on the GST portal, then use Re-push GST with the number (or upload in Shiprocket).
              </p>
            )}
          </div>
        </div> : (
          <div className="mb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="danger">Order cancelled</Badge>
              {paymentStatusBadge(active)}
            </div>
            {active.paymentStatus === "refunded" ? (
              <div className="p-3 rounded-md border border-success/30 bg-success-light/40">
                <div className="text-sm font-medium text-success">Refund initiated</div>
                <p className="text-xs text-muted mt-1">
                  Gateway refund processed for this order.
                  {active.refundedAt ? ` · ${formatDate(active.refundedAt)}` : ""}
                </p>
                {active.razorpayRefundId && (
                  <p className="text-xs font-mono text-ink mt-1.5">Refund ID: {active.razorpayRefundId}</p>
                )}
                {active.razorpayPaymentId && (
                  <p className="text-xs font-mono text-muted mt-0.5">Payment ID: {active.razorpayPaymentId}</p>
                )}
              </div>
            ) : active.paymentStatus === "paid" ? (
              <div className="p-3 rounded-md border border-amber/30 bg-amber-light/50">
                <div className="text-sm font-medium text-amber">Refund pending</div>
                <p className="text-xs text-muted mt-1">Order is cancelled but payment is still marked paid. Check Razorpay dashboard.</p>
              </div>
            ) : (
              <p className="text-xs text-muted">No online refund (COD / unpaid).</p>
            )}
            {active.cancelReason && <p className="text-sm text-muted">Reason: {active.cancelReason}</p>}
          </div>
        )}
        <div className="text-xs font-medium text-muted mb-2 mt-5">ITEMS</div>
        <div className="border border-border rounded-md divide-y divide-border mb-4">{active.items.length ? active.items.map((it, i) => <div key={i} className="flex items-center justify-between p-3 text-sm"><div><div className="font-medium">{it.name}</div><div className="text-xs text-muted">Qty {it.qty}</div></div><div className="font-mono">{formatINR(it.price)}</div></div>) : <div className="p-3 text-sm text-muted">No item details</div>}</div>
        <div className="flex justify-between text-base font-semibold py-2 border-t border-border"><span>Total</span><span className="font-mono">{formatINR(active.amount)}</span></div>
      </div>}
    </Drawer>
  </div>;
}
