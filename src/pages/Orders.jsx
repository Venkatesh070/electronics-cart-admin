import { useState } from "react";
import { Check, Printer, XCircle } from "lucide-react";
import { ordersApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, formatINR, nameOf, ORDER_STATUS_API, ORDER_STATUS_LABEL, titleCase } from "../utils/format";
import { Badge, Button, Card, Drawer, ErrorState, Field, inputCls, LoadingState, PageHeader, SearchInput, Select, Table } from "../components/ui";
import StatusDot from "../components/StatusDot";

const STAGES = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

function mapOrder(o) {
  const fullId = o._id || o.id;
  return {
    ...o, backendId: fullId, id: `#${String(fullId).slice(-8).toUpperCase()}`, customer: nameOf(o.user),
    city: o.shippingAddress?.city || "—", amount: Number(o.totalAmount) || 0,
    status: ORDER_STATUS_LABEL[o.status] || titleCase(o.status), apiStatus: o.status,
    payment: o.paymentMethod || "—", date: formatDate(o.createdAt),
    items: (o.items || []).map((it) => ({ name: nameOf(it.product, it.name || "Product"), qty: it.quantity || it.qty || 1, price: Number(it.price) || 0 })),
  };
}

export default function Orders() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [payment, setPayment] = useState("All");
  const [active, setActive] = useState(null);
  const apiStatus = status === "All" ? "" : ORDER_STATUS_API[status] || status;
  const { data, error, loading, reload } = useAsync(async () => (await ordersApi.list({ limit: 50, status: apiStatus, search: q })).data || [], [apiStatus, q]);
  const orders = (data || []).map(mapOrder);
  const rows = orders.filter((o) => payment === "All" || o.payment === payment);

  async function setOrderStatus(order, nextStatus) {
    try {
      const apiValue = ORDER_STATUS_API[nextStatus] || nextStatus;
      await ordersApi.updateStatus(order.backendId, { status: apiValue });
      setActive((a) => a ? { ...a, status: ORDER_STATUS_LABEL[apiValue] || titleCase(apiValue), apiStatus: apiValue } : a);
      await reload();
    } catch (e) { alert(e?.message || "Could not update order"); }
  }
  async function invoice(order) {
    try {
      const res = await ordersApi.invoice(order.backendId);
      const invoiceData = res.data || {};
      alert(`Invoice ${invoiceData.invoiceNumber || order.id}\nCustomer: ${order.customer}\nTotal: ${formatINR(invoiceData.totalAmount ?? order.amount)}`);
      console.info("Invoice", invoiceData);
    } catch (e) { alert(e?.message || "Could not load invoice"); }
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
        { key: "payment", label: "Payment" },
        { key: "amount", label: "Amount", render: (r) => <span className="font-mono">{formatINR(r.amount)}</span> },
        { key: "status", label: "Status", render: (r) => <StatusDot status={r.status} /> },
      ]} />
    </Card>
    <Drawer open={!!active} onClose={() => setActive(null)} title={active?.id}>
      {active && <div>
        <div className="flex items-center justify-between mb-5"><div><div className="font-medium text-ink">{active.customer}</div><div className="text-xs text-muted">{active.city} · {active.payment}</div></div>
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
        </div> : <Badge tone="danger">Order cancelled</Badge>}
        <div className="text-xs font-medium text-muted mb-2 mt-5">ITEMS</div>
        <div className="border border-border rounded-md divide-y divide-border mb-4">{active.items.length ? active.items.map((it, i) => <div key={i} className="flex items-center justify-between p-3 text-sm"><div><div className="font-medium">{it.name}</div><div className="text-xs text-muted">Qty {it.qty}</div></div><div className="font-mono">{formatINR(it.price)}</div></div>) : <div className="p-3 text-sm text-muted">No item details</div>}</div>
        <div className="flex justify-between text-base font-semibold py-2 border-t border-border"><span>Total</span><span className="font-mono">{formatINR(active.amount)}</span></div>
      </div>}
    </Drawer>
  </div>;
}
