import { useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { PageHeader, Card, Button, Modal, Field, inputCls } from "../components/ui";
import { brands as seed } from "../data/brands";

export default function Brands() {
  const [brands, setBrands] = useState(seed);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", featured: false });

  function openAdd() { setForm({ name: "", featured: false }); setModal("add"); }
  function save() {
    setBrands([{ id: `b${Date.now()}`, name: form.name, productCount: 0, featured: form.featured, logo: form.name.slice(0, 2).toUpperCase() }, ...brands]);
    setModal(null);
  }
  function toggleFeatured(id) { setBrands(brands.map((b) => b.id === id ? { ...b, featured: !b.featured } : b)); }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Brands"
        description="Manage brand listings and control which brands are featured on the homepage."
        action={<Button variant="primary" onClick={openAdd}><Plus size={14} /> Add brand</Button>}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {brands.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-md bg-primary-light text-primary-dark flex items-center justify-center font-display font-semibold">{b.logo}</div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded hover:bg-bg text-muted hover:text-ink"><Pencil size={14} /></button>
                <button onClick={() => setBrands(brands.filter((x) => x.id !== b.id))} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="font-medium text-ink">{b.name}</div>
            <div className="text-xs text-muted mb-3">{b.productCount} products</div>
            <button
              onClick={() => toggleFeatured(b.id)}
              className={`flex items-center gap-1.5 text-xs font-medium ${b.featured ? "text-amber" : "text-muted"}`}
            >
              <Star size={13} fill={b.featured ? "currentColor" : "none"} /> {b.featured ? "Featured on homepage" : "Feature on homepage"}
            </button>
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title="Add brand">
        <Field label="Brand name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
        <Field label="Logo"><input type="file" className={inputCls} /></Field>
        <label className="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          Feature on homepage
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim()}>Add brand</Button>
        </div>
      </Modal>
    </div>
  );
}
