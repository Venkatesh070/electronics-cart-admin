import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Card, Table, Button, Modal, Field, inputCls } from "../components/ui";

const seed = [
  { id: "T1", region: "Telangana", category: "Laptops", rate: 18 },
  { id: "T2", region: "Telangana", category: "Accessories", rate: 18 },
  { id: "T3", region: "Karnataka", category: "Laptops", rate: 18 },
  { id: "T4", region: "All India", category: "Gift Cards", rate: 0 },
];

export default function Taxes() {
  const [rules, setRules] = useState(seed);
  const [inclusive, setInclusive] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ region: "", category: "Laptops", rate: "18" });

  function add() {
    setRules([{ id: `T${Date.now()}`, ...form, rate: Number(form.rate) }, ...rules]);
    setModal(false); setForm({ region: "", category: "Laptops", rate: "18" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Finance" title="Taxes"
        description="Configure GST slabs by region and category."
        action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Add tax rule</Button>}
      />
      <Card className="p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="font-medium text-sm text-ink">Price display</div>
          <div className="text-xs text-muted">Show storefront prices as tax-inclusive or tax-exclusive.</div>
        </div>
        <button onClick={() => setInclusive(!inclusive)} className={`w-9 h-5 rounded-full relative transition-colors ${inclusive ? "bg-primary" : "bg-border"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${inclusive ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
        <span className="text-xs text-muted ml-2 w-28 text-right">{inclusive ? "Tax-inclusive" : "Tax-exclusive"}</span>
      </Card>
      <Card className="p-4">
        <Table
          columns={[
            { key: "region", label: "Region" },
            { key: "category", label: "Category" },
            { key: "rate", label: "GST rate", render: (r) => `${r.rate}%` },
            { key: "del", label: "", render: (r) => <button onClick={() => setRules(rules.filter((x) => x.id !== r.id))} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={14} /></button> },
          ]}
          rows={rules}
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Add tax rule">
        <Field label="Region"><input className={inputCls} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. Telangana" /></Field>
        <Field label="Category"><input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
        <Field label="GST rate (%)"><input type="number" className={inputCls} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={add} disabled={!form.region.trim()}>Add rule</Button>
        </div>
      </Modal>
    </div>
  );
}
