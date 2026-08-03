import { useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { PageHeader, Card, Table, Button, Modal, Field, inputCls, Badge } from "../components/ui";

const seed = [
  { id: "Z1", zone: "Hyderabad Metro", rate: 0, freeAbove: 999, eta: "1-2 days" },
  { id: "Z2", zone: "Telangana (rest)", rate: 99, freeAbove: 2999, eta: "2-4 days" },
  { id: "Z3", zone: "South India", rate: 149, freeAbove: 4999, eta: "3-5 days" },
  { id: "Z4", zone: "Rest of India", rate: 199, freeAbove: 4999, eta: "4-7 days" },
];

const couriers = [
  { id: "C1", name: "Delhivery", status: "Connected" },
  { id: "C2", name: "Blue Dart", status: "Connected" },
  { id: "C3", name: "Ekart", status: "Not connected" },
];

export default function Shipping() {
  const [zones, setZones] = useState(seed);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ zone: "", rate: "", freeAbove: "", eta: "" });

  function add() {
    setZones([{ id: `Z${Date.now()}`, ...form, rate: Number(form.rate), freeAbove: Number(form.freeAbove) }, ...zones]);
    setModal(false); setForm({ zone: "", rate: "", freeAbove: "", eta: "" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Finance" title="Shipping"
        description="Manage shipping zones, rates, free-shipping thresholds, and courier partners."
        action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Add zone</Button>}
      />
      <Card className="p-4 mb-4">
        <Table
          columns={[
            { key: "zone", label: "Zone" },
            { key: "rate", label: "Rate", render: (r) => r.rate === 0 ? "Free" : `₹${r.rate}` },
            { key: "freeAbove", label: "Free above", render: (r) => `₹${r.freeAbove.toLocaleString("en-IN")}` },
            { key: "eta", label: "Delivery ETA" },
            { key: "del", label: "", render: (r) => <button onClick={() => setZones(zones.filter((x) => x.id !== r.id))} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={14} /></button> },
          ]}
          rows={zones}
        />
      </Card>
      <Card className="p-4">
        <div className="text-xs font-medium text-muted mb-3">COURIER PARTNERS</div>
        <div className="flex flex-col divide-y divide-border">
          {couriers.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2"><Truck size={15} className="text-muted" /><span className="text-sm font-medium">{c.name}</span></div>
              <Badge tone={c.status === "Connected" ? "success" : "neutral"}>{c.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Add shipping zone">
        <Field label="Zone name"><input className={inputCls} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Rate (₹)"><input type="number" className={inputCls} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Field>
          <Field label="Free above (₹)"><input type="number" className={inputCls} value={form.freeAbove} onChange={(e) => setForm({ ...form, freeAbove: e.target.value })} /></Field>
        </div>
        <Field label="Delivery ETA"><input className={inputCls} value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} placeholder="e.g. 3-5 days" /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={add} disabled={!form.zone.trim()}>Add zone</Button>
        </div>
      </Modal>
    </div>
  );
}
