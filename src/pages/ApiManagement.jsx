import { useState } from "react";
import { Plus, Copy, Trash2, Webhook } from "lucide-react";
import { PageHeader, Card, Table, Badge, Button, Modal, Field, inputCls } from "../components/ui";

const seedKeys = [
  { id: "K1", name: "Storefront (production)", key: "ec_live_8f2a...c93d", rateLimit: "1000/min", status: "Active", created: "2026-04-11" },
  { id: "K2", name: "Mobile app", key: "ec_live_4b91...771e", rateLimit: "600/min", status: "Active", created: "2026-05-02" },
  { id: "K3", name: "Analytics integration (old)", key: "ec_live_a021...5f4c", rateLimit: "200/min", status: "Revoked", created: "2025-12-18" },
];

const webhooks = [
  { id: "W1", event: "order.created", url: "https://hooks.electronicscart.in/orders", status: "Active" },
  { id: "W2", event: "payment.failed", url: "https://hooks.electronicscart.in/payments", status: "Active" },
  { id: "W3", event: "return.approved", url: "https://hooks.electronicscart.in/returns", status: "Paused" },
];

export default function ApiManagement() {
  const [keys, setKeys] = useState(seedKeys);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", rateLimit: "600/min" });

  function generate() {
    setKeys([{ id: `K${Date.now()}`, name: form.name, key: `ec_live_${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`, rateLimit: form.rateLimit, status: "Active", created: "2026-08-03" }, ...keys]);
    setModal(false); setForm({ name: "", rateLimit: "600/min" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="System" title="API Management"
        description="Generate and revoke API keys, set rate limits, and configure webhooks."
        action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Generate key</Button>}
      />
      <Card className="p-4 mb-4">
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "key", label: "Key", render: (r) => <span className="font-mono text-xs flex items-center gap-1.5">{r.key} <Copy size={12} className="text-muted cursor-pointer" /></span> },
            { key: "rateLimit", label: "Rate limit", render: (r) => <span className="font-mono text-xs">{r.rateLimit}</span> },
            { key: "created", label: "Created", render: (r) => <span className="font-mono text-xs text-muted">{r.created}</span> },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Active" ? "success" : "neutral"}>{r.status}</Badge> },
            { key: "revoke", label: "", render: (r) => r.status === "Active" && (
                <button onClick={() => setKeys(keys.map((k) => k.id === r.id ? { ...k, status: "Revoked" } : k))} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={14} /></button>
              ) },
          ]}
          rows={keys}
        />
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted mb-3"><Webhook size={13} /> WEBHOOKS</div>
        <div className="flex flex-col divide-y divide-border">
          {webhooks.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2.5 text-sm">
              <div><span className="font-mono text-xs bg-bg px-1.5 py-0.5 rounded mr-2">{w.event}</span><span className="text-muted text-xs">{w.url}</span></div>
              <Badge tone={w.status === "Active" ? "success" : "neutral"}>{w.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Generate API key">
        <Field label="Key name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Warehouse integration" /></Field>
        <Field label="Rate limit">
          <select className={inputCls} value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: e.target.value })}>
            <option>200/min</option><option>600/min</option><option>1000/min</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={generate} disabled={!form.name.trim()}>Generate key</Button>
        </div>
      </Modal>
    </div>
  );
}
