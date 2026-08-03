import { useState } from "react";
import { Printer, XCircle, Check } from "lucide-react";
import { PageHeader, Card, Table, Badge, SearchInput, Select, useSearchFilter, Drawer, Button, Field, inputCls } from "../components/ui";
import StatusDot from "../components/StatusDot";
import { orders as seed } from "../data/orders";

const STAGES = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

export default function Orders() {
  const [orders, setOrders] = useState(seed);
  const [filtered, q, setQ] = useSearchFilter(orders, ["id", "customer"]);
  const [status, setStatus] = useState("All");
  const [payment, setPayment] = useState("All");
  const [active, setActive] = useState(null);

  const rows = filtered.filter((o) => (status === "All" || o.status === status) && (payment === "All" || o.payment === payment));

  function setOrderStatus(id, s) {
    setOrders(orders.map((o) => o.id === id ? { ...o, status: s } : o));
    setActive((a) => a && a.id === id ? { ...a, status: s } : a);
  }

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Orders" description={`${orders.length} orders. Filter, update status, and print invoices.`} />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search order ID or customer…" />
          <Select value={status} onChange={setStatus} options={["All", ...STAGES, "Cancelled"]} />
          <Select value={payment} onChange={setPayment} options={["All", "UPI", "Card", "Net Banking", "COD", "EMI"]} />
        </div>
        <Table
          columns={[
            { key: "id", label: "Order ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "customer", label: "Customer", render: (r) => <div><div className="font-medium">{r.customer}</div><div className="text-xs text-muted">{r.city}</div></div> },
            { key: "date", label: "Date", render: (r) => <span className="font-mono text-xs text-muted">{r.date}</span> },
            { key: "payment", label: "Payment" },
            { key: "amount", label: "Amount", render: (r) => <span className="font-mono">₹{r.amount.toLocaleString("en-IN")}</span> },
            { key: "status", label: "Status", render: (r) => <StatusDot status={r.status} /> },
          ]}
          rows={rows}
          onRowClick={setActive}
        />
      </Card>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.id}>
        {active && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-medium text-ink">{active.customer}</div>
                <div className="text-xs text-muted">{active.city} · {active.payment}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary"><Printer size={13} /> Invoice</Button>
                {active.status !== "Cancelled" && active.status !== "Delivered" && (
                  <Button size="sm" variant="danger" onClick={() => setOrderStatus(active.id, "Cancelled")}><XCircle size={13} /> Cancel</Button>
                )}
              </div>
            </div>

            {active.status !== "Cancelled" ? (
              <div className="mb-6">
                <div className="text-xs font-medium text-muted mb-3">DELIVERY TIMELINE</div>
                <div className="flex items-center">
                  {STAGES.map((s, i) => {
                    const reached = STAGES.indexOf(active.status) >= i;
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center relative">
                        {i > 0 && <div className={`absolute right-1/2 top-2.5 h-0.5 w-full -z-0 ${reached ? "bg-primary" : "bg-border"}`} />}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${reached ? "bg-primary text-white" : "bg-white border-2 border-border"}`}>
                          {reached && <Check size={11} />}
                        </div>
                        <span className={`text-[10px] mt-1.5 text-center ${reached ? "text-ink font-medium" : "text-muted"}`}>{s}</span>
                      </div>
                    );
                  })}
                </div>
                <Field label="Update status" className="mt-4">
                  <select className={inputCls} value={active.status} onChange={(e) => setOrderStatus(active.id, e.target.value)}>
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            ) : (
              <Badge tone="danger">Order cancelled</Badge>
            )}

            <div className="text-xs font-medium text-muted mb-2 mt-5">ITEMS</div>
            <div className="border border-border rounded-md divide-y divide-border mb-4">
              {active.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between p-3 text-sm">
                  <div><div className="font-medium text-ink">{it.name}</div><div className="text-xs text-muted">Qty {it.qty}</div></div>
                  <div className="font-mono">₹{it.price.toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm py-1"><span className="text-muted">Subtotal</span><span className="font-mono">₹{active.amount.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-sm py-1"><span className="text-muted">Shipping</span><span className="font-mono">₹0</span></div>
            <div className="flex justify-between text-base font-semibold py-2 border-t border-border mt-1"><span>Total</span><span className="font-mono">₹{active.amount.toLocaleString("en-IN")}</span></div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
