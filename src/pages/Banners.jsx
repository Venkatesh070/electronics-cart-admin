import { useState } from "react";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { PageHeader, Card, Badge, Button, Modal, Field, inputCls } from "../components/ui";
import { banners as seed } from "../data/misc";

export default function Banners() {
  const [banners, setBanners] = useState(seed);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", placement: "Homepage Hero", start: "", end: "", priority: 1 });

  function create() {
    setBanners([{ id: `BN${Date.now()}`, ...form, priority: Number(form.priority), status: "Scheduled" }, ...banners]);
    setModal(false);
    setForm({ title: "", placement: "Homepage Hero", start: "", end: "", priority: 1 });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Content" title="Banners"
        description="Schedule homepage and category banners with placement and priority."
        action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Add banner</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b) => (
          <Card key={b.id} className="overflow-hidden">
            <div className="h-28 bg-gradient-to-br from-primary/15 to-amber/10 flex items-center justify-center">
              <ImageIcon size={22} className="text-primary/50" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-ink">{b.title}</div>
                <Badge tone={b.status === "Live" ? "success" : b.status === "Scheduled" ? "amber" : "neutral"}>{b.status}</Badge>
              </div>
              <div className="text-xs text-muted mb-2">{b.placement} · Priority {b.priority}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted">{b.start} → {b.end}</span>
                <button onClick={() => setBanners(banners.filter((x) => x.id !== b.id))} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add banner">
        <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Placement">
          <select className={inputCls} value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
            <option>Homepage Hero</option><option>Category — Gaming Laptops</option><option>Category — Accessories</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Start date"><input type="date" className={inputCls} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
          <Field label="End date"><input type="date" className={inputCls} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
        </div>
        <Field label="Priority"><input type="number" className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></Field>
        <Field label="Image"><input type="file" className={inputCls} /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!form.title.trim()}>Add banner</Button>
        </div>
      </Modal>
    </div>
  );
}
