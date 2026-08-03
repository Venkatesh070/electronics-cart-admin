import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import { PageHeader, Card, Badge, Button, Modal, Field, inputCls } from "../components/ui";
import { flashSales as seed } from "../data/misc";

export default function FlashSales() {
  const [sales, setSales] = useState(seed);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", discount: "", stockCap: "", start: "", end: "" });

  function create() {
    setSales([{ id: `FS${Date.now()}`, ...form, products: 0, sold: 0, stockCap: Number(form.stockCap), status: "Scheduled" }, ...sales]);
    setModal(false);
    setForm({ name: "", discount: "", stockCap: "", start: "", end: "" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Sales" title="Flash Sales"
        description="Create time-boxed sales with stock caps and track live performance."
        action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Create flash sale</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sales.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-amber-light text-amber flex items-center justify-center"><Zap size={16} /></div>
                <div>
                  <div className="font-medium text-ink">{s.name}</div>
                  <div className="text-xs text-muted">{s.products} products · {s.discount}</div>
                </div>
              </div>
              <Badge tone={s.status === "Live" ? "success" : s.status === "Scheduled" ? "amber" : "neutral"}>{s.status}</Badge>
            </div>
            <div className="text-xs text-muted mb-1.5">Stock sold: {s.sold}/{s.stockCap}</div>
            <div className="h-2 bg-bg rounded-full overflow-hidden mb-3">
              <div className="h-full bg-amber" style={{ width: `${Math.min(100, (s.sold / s.stockCap) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs font-mono text-muted">
              <span>{s.start}</span><span>→</span><span>{s.end}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create flash sale">
        <Field label="Sale name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Discount (e.g. Flat 20% / Up to 30%)"><input className={inputCls} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></Field>
          <Field label="Stock cap"><input type="number" className={inputCls} value={form.stockCap} onChange={(e) => setForm({ ...form, stockCap: e.target.value })} /></Field>
          <Field label="Start"><input type="datetime-local" className={inputCls} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
          <Field label="End"><input type="datetime-local" className={inputCls} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!form.name.trim()}>Create sale</Button>
        </div>
      </Modal>
    </div>
  );
}
