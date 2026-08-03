import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Card, Table, Badge, Button, Modal, Field, inputCls } from "../components/ui";
import { coupons as seed } from "../data/misc";
import { categories } from "../data/categories";

export default function Coupons() {
  const [coupons, setCoupons] = useState(seed);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ code: "", type: "Flat", value: "", minOrder: "", limit: "", validTill: "", categories: "All" });

  function save() {
    setCoupons([{ id: `CP${Date.now()}`, ...form, value: Number(form.value), minOrder: Number(form.minOrder), limit: Number(form.limit), used: 0, status: "Active" }, ...coupons]);
    setModal(false);
    setForm({ code: "", type: "Flat", value: "", minOrder: "", limit: "", validTill: "", categories: "All" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Sales" title="Coupons"
        description="Create and track discount coupons across the storefront."
        action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Create coupon</Button>}
      />
      <Card className="p-4">
        <Table
          columns={[
            { key: "code", label: "Code", render: (r) => <span className="font-mono font-medium text-ink">{r.code}</span> },
            { key: "value", label: "Discount", render: (r) => r.type === "Flat" ? `₹${r.value} off` : `${r.value}% off` },
            { key: "minOrder", label: "Min order", render: (r) => `₹${r.minOrder.toLocaleString("en-IN")}` },
            { key: "categories", label: "Applies to" },
            { key: "used", label: "Usage", render: (r) => (
                <div className="w-28">
                  <div className="text-xs text-muted mb-1">{r.used}/{r.limit}</div>
                  <div className="h-1.5 bg-bg rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (r.used / r.limit) * 100)}%` }} /></div>
                </div>
              ) },
            { key: "validTill", label: "Valid till", render: (r) => <span className="font-mono text-xs">{r.validTill}</span> },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Active" ? "success" : "neutral"}>{r.status}</Badge> },
            { key: "del", label: "", render: (r) => <button onClick={() => setCoupons(coupons.filter((c) => c.id !== r.id))} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={14} /></button> },
          ]}
          rows={coupons}
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Create coupon">
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Coupon code"><input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
          <Field label="Discount type">
            <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Flat</option><option>Percent</option></select>
          </Field>
          <Field label={form.type === "Flat" ? "Amount (₹)" : "Percent (%)"}><input type="number" className={inputCls} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
          <Field label="Minimum order value (₹)"><input type="number" className={inputCls} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></Field>
          <Field label="Usage limit"><input type="number" className={inputCls} value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} /></Field>
          <Field label="Valid till"><input type="date" className={inputCls} value={form.validTill} onChange={(e) => setForm({ ...form, validTill: e.target.value })} /></Field>
          <Field label="Applicable categories">
            <select className={inputCls} value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })}>
              <option>All</option>
              {categories.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!form.code.trim()}>Create coupon</Button>
        </div>
      </Modal>
    </div>
  );
}
