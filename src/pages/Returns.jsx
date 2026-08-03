import { useState } from "react";
import { PageHeader, Card, Table, Badge, Select, Button, Modal, Field, inputCls } from "../components/ui";
import { returns as seed } from "../data/misc";

const STATUSES = ["Requested", "Pickup Scheduled", "Inspecting", "Refunded", "Rejected"];

export default function Returns() {
  const [rows, setRows] = useState(seed);
  const [status, setStatus] = useState("All");
  const [active, setActive] = useState(null);

  const filtered = rows.filter((r) => status === "All" || r.status === status);

  function updateStatus(id, s) {
    setRows(rows.map((r) => r.id === id ? { ...r, status: s } : r));
    setActive((a) => a && a.id === id ? { ...a, status: s } : a);
  }

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Returns" description="Review return and exchange requests, manage pickups, and process refunds." />
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Select value={status} onChange={setStatus} options={["All", ...STATUSES]} />
        </div>
        <Table
          columns={[
            { key: "id", label: "Return ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "orderId", label: "Order", render: (r) => <span className="font-mono text-xs text-muted">{r.orderId}</span> },
            { key: "customer", label: "Customer" },
            { key: "item", label: "Item" },
            { key: "type", label: "Type", render: (r) => <Badge tone={r.type === "Refund" ? "primary" : "neutral"}>{r.type}</Badge> },
            { key: "amount", label: "Amount", render: (r) => `₹${r.amount.toLocaleString("en-IN")}` },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Refunded" ? "success" : r.status === "Rejected" ? "danger" : "amber"}>{r.status}</Badge> },
          ]}
          rows={filtered}
          onRowClick={setActive}
        />
      </Card>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.id}>
        {active && (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><div className="text-xs text-muted">Order</div><div className="font-mono">{active.orderId}</div></div>
              <div><div className="text-xs text-muted">Customer</div>{active.customer}</div>
              <div><div className="text-xs text-muted">Item</div>{active.item}</div>
              <div><div className="text-xs text-muted">Reason</div>{active.reason}</div>
              <div><div className="text-xs text-muted">Requested</div><div className="font-mono">{active.date}</div></div>
              <div><div className="text-xs text-muted">Amount</div><div className="font-mono">₹{active.amount.toLocaleString("en-IN")}</div></div>
            </div>
            <Field label="Update status">
              <select className={inputCls} value={active.status} onChange={(e) => updateStatus(active.id, e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="danger" onClick={() => updateStatus(active.id, "Rejected")}>Reject</Button>
              <Button variant="primary" onClick={() => updateStatus(active.id, "Refunded")}>Approve &amp; refund</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
