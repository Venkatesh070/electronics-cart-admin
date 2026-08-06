import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { returnsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, formatINR, idOf, nameOf, titleCase } from "../utils/format";
import { Badge, Button, Card, ErrorState, LoadingState, Modal, PageHeader, Select, Table } from "../components/ui";

const STATUSES = ["requested", "approved", "rejected", "picked_up", "inspected", "refunded"];

function mapReturn(r) {
  const id = idOf(r);
  return {
    ...r,
    id,
    displayId: `#${String(id).slice(-8).toUpperCase()}`,
    orderId: `#${String(idOf(r.order)).slice(-8).toUpperCase()}`,
    customer: nameOf(r.user),
    item: nameOf(r.product),
    type: titleCase(r.resolution),
    amount: Number(r.refundAmount) || 0,
    statusLabel: titleCase(r.status),
    date: formatDate(r.createdAt),
    awb: r.shiprocket?.awb || "",
    trackUrl: r.shiprocket?.trackingUrl || (r.shiprocket?.awb ? `https://shiprocket.co/tracking/${r.shiprocket.awb}` : ""),
    srStatus: r.shiprocket?.status || "",
    refundId: r.razorpayRefundId || "",
  };
}

export default function Returns() {
  const [status, setStatus] = useState("All");
  const [active, setActive] = useState(null);
  const [busy, setBusy] = useState("");
  const { data, error, loading, reload } = useAsync(
    async () => (await returnsApi.list({ status: status === "All" ? undefined : status })).data || [],
    [status]
  );
  const rows = (data || []).map(mapReturn);

  async function updateStatus(nextStatus) {
    setBusy(nextStatus);
    try {
      const res = await returnsApi.updateStatus(active.id, { status: nextStatus });
      if (res?.warning) alert(`Approved, but Shiprocket warning: ${res.warning}`);
      else if (nextStatus === "approved" && res?.data?.shiprocket?.awb) {
        alert(`Return approved. Pickup AWB: ${res.data.shiprocket.awb}`);
      } else if (nextStatus === "refunded" && res?.refund?.refunded) {
        alert(`Refund initiated${res.refund.refundId ? ` (${res.refund.refundId})` : ""}`);
      } else if (nextStatus === "refunded" && res?.refund?.error) {
        alert(`Marked received, but refund failed: ${res.refund.error}`);
      }
      await reload();
      setActive(null);
    } catch (e) {
      alert(e?.message || "Could not update return");
    } finally {
      setBusy("");
    }
  }

  async function syncShiprocket() {
    setBusy("sync");
    try {
      const res = await returnsApi.syncShiprocket(active.id);
      if (res?.refund?.refunded) {
        alert(`Return received at warehouse — refund initiated${res.refund.refundId ? ` (${res.refund.refundId})` : ""}`);
      } else {
        alert(`Synced. Shiprocket status: ${res?.shiprocket?.status || res?.data?.shiprocket?.status || "updated"}`);
      }
      await reload();
      if (res?.data) setActive(mapReturn(res.data));
      else setActive(null);
    } catch (e) {
      alert(e?.message || "Could not sync Shiprocket return");
    } finally {
      setBusy("");
    }
  }

  if (loading && !data) return <LoadingState label="Loading returns…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Returns"
        description="Approve to create a Shiprocket reverse pickup. When the package is delivered to your warehouse, refund starts automatically."
      />
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Select
            value={status}
            onChange={setStatus}
            options={[{ value: "All", label: "All" }, ...STATUSES.map((value) => ({ value, label: titleCase(value) }))]}
          />
        </div>
        <Table
          rows={rows}
          empty="No return requests found."
          onRowClick={setActive}
          columns={[
            { key: "displayId", label: "Return ID", render: (r) => <span className="font-mono text-xs">{r.displayId}</span> },
            { key: "orderId", label: "Order", render: (r) => <span className="font-mono text-xs text-muted">{r.orderId}</span> },
            { key: "customer", label: "Customer" },
            { key: "item", label: "Item" },
            {
              key: "type",
              label: "Type",
              render: (r) => <Badge tone={r.resolution === "refund" ? "primary" : "neutral"}>{r.type}</Badge>,
            },
            { key: "amount", label: "Amount", render: (r) => formatINR(r.amount) },
            {
              key: "awb",
              label: "Return AWB",
              render: (r) =>
                r.awb ? (
                  <span className="font-mono text-xs">{r.awb}</span>
                ) : (
                  <span className="text-xs text-muted">—</span>
                ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <div className="flex flex-col gap-1 items-start">
                  <Badge
                    tone={
                      r.status === "refunded" || r.status === "approved"
                        ? "success"
                        : r.status === "rejected"
                          ? "danger"
                          : "amber"
                    }
                  >
                    {r.statusLabel}
                  </Badge>
                  {r.refundId && <Badge tone="success">Refund initiated</Badge>}
                </div>
              ),
            },
          ]}
        />
      </Card>
      <Modal open={!!active} onClose={() => setActive(null)} title={active?.displayId}>
        {active && (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <div className="text-xs text-muted">Order</div>
                <div className="font-mono">{active.orderId}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Customer</div>
                {active.customer}
              </div>
              <div>
                <div className="text-xs text-muted">Item</div>
                {active.item}
              </div>
              <div>
                <div className="text-xs text-muted">Reason</div>
                {active.reason}
              </div>
              <div>
                <div className="text-xs text-muted">Requested</div>
                <div className="font-mono">{active.date}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Refund amount</div>
                <div className="font-mono">{formatINR(active.amount)}</div>
              </div>
            </div>

            {(active.awb || active.shiprocket?.orderId) && (
              <div className="mb-4 p-3 rounded-md border border-border bg-white">
                <div className="text-xs font-medium text-muted mb-1">SHIPROCKET RETURN</div>
                <div className="text-sm text-ink">
                  {active.awb ? (
                    <>
                      AWB <span className="font-mono">{active.awb}</span>
                      {active.srStatus ? ` · ${active.srStatus}` : ""}
                    </>
                  ) : (
                    <>SR order #{active.shiprocket?.orderId}</>
                  )}
                </div>
                {active.trackUrl && (
                  <a
                    href={active.trackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary inline-flex items-center gap-1 mt-1.5 font-semibold"
                  >
                    Track return <ExternalLink size={11} />
                  </a>
                )}
                {active.refundId && (
                  <p className="text-xs font-mono text-success mt-2">Refund ID: {active.refundId}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              {active.status === "requested" && (
                <>
                  <Button variant="danger" disabled={!!busy} onClick={() => updateStatus("rejected")}>
                    Reject
                  </Button>
                  <Button disabled={!!busy} onClick={() => updateStatus("approved")}>
                    {busy === "approved" ? "Approving…" : "Approve + Shiprocket pickup"}
                  </Button>
                </>
              )}
              {["approved", "picked_up", "inspected"].includes(active.status) && active.shiprocket?.orderId && (
                <Button variant="secondary" disabled={!!busy} onClick={syncShiprocket}>
                  <RefreshCw size={13} /> {busy === "sync" ? "Syncing…" : "Sync Shiprocket"}
                </Button>
              )}
              {active.status === "approved" && (
                <Button disabled={!!busy} onClick={() => updateStatus("picked_up")}>
                  Mark picked up
                </Button>
              )}
              {(active.status === "picked_up" || active.status === "inspected") && (
                <Button disabled={!!busy} onClick={() => updateStatus("refunded")}>
                  {busy === "refunded"
                    ? "…"
                    : active.resolution === "replacement"
                      ? "Mark replaced"
                      : "Mark refunded"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
