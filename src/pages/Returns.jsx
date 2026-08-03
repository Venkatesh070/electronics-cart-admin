import { useState } from "react";
import { returnsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, formatINR, idOf, nameOf, titleCase } from "../utils/format";
import { Badge, Button, Card, ErrorState, LoadingState, Modal, PageHeader, Select, Table } from "../components/ui";

const STATUSES = ["requested", "approved", "rejected", "picked_up", "inspected", "refunded"];

function mapReturn(r) {
  const id = idOf(r);
  return {
    ...r, id, displayId: `#${String(id).slice(-8).toUpperCase()}`, orderId: `#${String(idOf(r.order)).slice(-8).toUpperCase()}`,
    customer: nameOf(r.user), item: nameOf(r.product), type: titleCase(r.resolution),
    amount: Number(r.refundAmount) || 0, statusLabel: titleCase(r.status), date: formatDate(r.createdAt),
  };
}

export default function Returns() {
  const [status, setStatus] = useState("All");
  const [active, setActive] = useState(null);
  const { data, error, loading, reload } = useAsync(async () => (await returnsApi.list({ status })).data || [], [status]);
  const rows = (data || []).map(mapReturn);

  async function updateStatus(nextStatus) {
    try {
      await returnsApi.updateStatus(active.id, { status: nextStatus });
      await reload(); setActive(null);
    } catch (e) { alert(e?.message || "Could not update return"); }
  }
  if (loading && !data) return <LoadingState label="Loading returns…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return <div>
    <PageHeader eyebrow="Sales" title="Returns" description="Review return and exchange requests, manage pickups, and process refunds." />
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4"><Select value={status} onChange={setStatus} options={[{ value: "All", label: "All" }, ...STATUSES.map((value) => ({ value, label: titleCase(value) }))]} /></div>
      <Table rows={rows} empty="No return requests found." onRowClick={setActive} columns={[
        { key: "displayId", label: "Return ID", render: (r) => <span className="font-mono text-xs">{r.displayId}</span> },
        { key: "orderId", label: "Order", render: (r) => <span className="font-mono text-xs text-muted">{r.orderId}</span> },
        { key: "customer", label: "Customer" }, { key: "item", label: "Item" },
        { key: "type", label: "Type", render: (r) => <Badge tone={r.resolution === "refund" ? "primary" : "neutral"}>{r.type}</Badge> },
        { key: "amount", label: "Amount", render: (r) => formatINR(r.amount) },
        { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "refunded" || r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "amber"}>{r.statusLabel}</Badge> },
      ]} />
    </Card>
    <Modal open={!!active} onClose={() => setActive(null)} title={active?.displayId}>
      {active && <div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><div className="text-xs text-muted">Order</div><div className="font-mono">{active.orderId}</div></div>
          <div><div className="text-xs text-muted">Customer</div>{active.customer}</div>
          <div><div className="text-xs text-muted">Item</div>{active.item}</div>
          <div><div className="text-xs text-muted">Reason</div>{active.reason}</div>
          <div><div className="text-xs text-muted">Requested</div><div className="font-mono">{active.date}</div></div>
          <div><div className="text-xs text-muted">Refund amount</div><div className="font-mono">{formatINR(active.amount)}</div></div>
        </div>
        <div className="flex justify-end gap-2"><Button variant="danger" onClick={() => updateStatus("rejected")}>Reject</Button><Button onClick={() => updateStatus("approved")}>Approve</Button></div>
      </div>}
    </Modal>
  </div>;
}
