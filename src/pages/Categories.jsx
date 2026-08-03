import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { PageHeader, Card, Button, Modal, Field, inputCls, Badge } from "../components/ui";
import { categories as seed } from "../data/categories";

export default function Categories() {
  const [cats, setCats] = useState(seed);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", parent: "", description: "" });

  function move(catId, dir) {
    const idx = cats.findIndex((c) => c.id === catId);
    const swap = idx + dir;
    if (swap < 0 || swap >= cats.length) return;
    const next = [...cats];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setCats(next);
  }

  function openAdd(parentId) { setForm({ name: "", parent: parentId || "", description: "" }); setModal("add"); }

  function save() {
    if (form.parent) {
      setCats(cats.map((c) => c.id === form.parent ? { ...c, children: [...c.children, { id: `${form.parent}-${Date.now()}`, name: form.name, productCount: 0, parent: form.parent }] } : c));
    } else {
      setCats([...cats, { id: `c${Date.now()}`, name: form.name, productCount: 0, parent: null, children: [] }]);
    }
    setModal(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Manage the category tree, subcategories, and how they appear in navigation."
        action={<Button variant="primary" onClick={() => openAdd(null)}><Plus size={14} /> Add category</Button>}
      />

      <div className="flex flex-col gap-3">
        {cats.map((c, i) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center gap-3">
              <GripVertical size={15} className="text-muted cursor-grab" />
              <div className="w-10 h-10 rounded-md bg-primary-light flex items-center justify-center text-primary-dark font-display font-semibold text-sm shrink-0">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink">{c.name}</div>
                <div className="text-xs text-muted">{c.productCount} products · {c.children.length} subcategories</div>
              </div>
              <Badge tone="primary">Top level</Badge>
              <div className="flex gap-1">
                <button onClick={() => move(c.id, -1)} disabled={i === 0} className="p-1.5 rounded hover:bg-bg text-muted disabled:opacity-30"><ChevronUp size={14} /></button>
                <button onClick={() => move(c.id, 1)} disabled={i === cats.length - 1} className="p-1.5 rounded hover:bg-bg text-muted disabled:opacity-30"><ChevronDown size={14} /></button>
                <button onClick={() => openAdd(c.id)} className="p-1.5 rounded hover:bg-bg text-muted hover:text-ink"><Plus size={14} /></button>
                <button className="p-1.5 rounded hover:bg-bg text-muted hover:text-ink"><Pencil size={14} /></button>
                <button
                  onClick={() => setCats(cats.filter((x) => x.id !== c.id))}
                  className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"
                ><Trash2 size={14} /></button>
              </div>
            </div>
            {c.children.length > 0 && (
              <div className="mt-3 ml-[3.25rem] flex flex-col gap-1.5 border-l border-border pl-4">
                {c.children.map((sc) => (
                  <div key={sc.id} className="flex items-center gap-3 py-1.5">
                    <span className="text-sm text-ink flex-1">{sc.name}</span>
                    <span className="text-xs text-muted">{sc.productCount} products</span>
                    <button className="p-1 rounded hover:bg-bg text-muted hover:text-ink"><Pencil size={12} /></button>
                    <button
                      onClick={() => setCats(cats.map((c2) => c2.id === c.id ? { ...c2, children: c2.children.filter((x) => x.id !== sc.id) } : c2))}
                      className="p-1 rounded hover:bg-danger-light text-muted hover:text-danger"
                    ><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={form.parent ? "Add subcategory" : "Add category"}>
        <Field label="Name">
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Parent category">
          <select className={inputCls} value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
            <option value="">— None (top level) —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Description">
          <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Image"><input type="file" className={inputCls} /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim()}>Save category</Button>
        </div>
      </Modal>
    </div>
  );
}
