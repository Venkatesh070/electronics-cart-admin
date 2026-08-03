import { useState } from "react";
import { Plus, Mail, MessageSquare } from "lucide-react";
import { PageHeader, Card, Table, Badge, Button, Modal, Field, inputCls } from "../components/ui";

const seed = [
  { id: "CM1", name: "August Laptop Sale", channel: "Email", audience: "All customers", sent: 12400, opened: "38%", clicked: "9.2%", status: "Completed" },
  { id: "CM2", name: "Cart abandonment reminder", channel: "SMS", audience: "Abandoned cart (7d)", sent: 890, opened: "—", clicked: "14%", status: "Running" },
  { id: "CM3", name: "VIP early access — Flash Sale", channel: "Email", audience: "VIP segment", sent: 640, opened: "61%", clicked: "22%", status: "Completed" },
  { id: "CM4", name: "Independence Day teaser", channel: "Email", audience: "All customers", sent: 0, opened: "—", clicked: "—", status: "Scheduled" },
];

export default function Marketing() {
  const [campaigns, setCampaigns] = useState(seed);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", channel: "Email", audience: "All customers" });

  function create() {
    setCampaigns([{ id: `CM${Date.now()}`, ...form, sent: 0, opened: "—", clicked: "—", status: "Scheduled" }, ...campaigns]);
    setModal(false);
    setForm({ name: "", channel: "Email", audience: "All customers" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Content" title="Marketing"
        description="Build email and SMS campaigns and track performance."
        action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> New campaign</Button>}
      />
      <Card className="p-4">
        <Table
          columns={[
            { key: "name", label: "Campaign", render: (r) => (
                <div className="flex items-center gap-2">
                  {r.channel === "Email" ? <Mail size={14} className="text-muted" /> : <MessageSquare size={14} className="text-muted" />}
                  <span className="font-medium">{r.name}</span>
                </div>
              ) },
            { key: "audience", label: "Audience" },
            { key: "sent", label: "Sent" },
            { key: "opened", label: "Open rate" },
            { key: "clicked", label: "Click rate" },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Completed" ? "success" : r.status === "Running" ? "primary" : "amber"}>{r.status}</Badge> },
          ]}
          rows={campaigns}
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="New campaign">
        <Field label="Campaign name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Channel">
          <select className={inputCls} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}><option>Email</option><option>SMS</option></select>
        </Field>
        <Field label="Audience segment">
          <select className={inputCls} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
            <option>All customers</option><option>VIP segment</option><option>Abandoned cart (7d)</option><option>New customers (30d)</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!form.name.trim()}>Schedule campaign</Button>
        </div>
      </Modal>
    </div>
  );
}
