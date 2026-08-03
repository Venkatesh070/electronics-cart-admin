import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { brandsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf, mediaUrl } from "../utils/format";
import { Button, Card, EmptyState, ErrorState, Field, inputCls, LoadingState, Modal, PageHeader } from "../components/ui";
import ImageField from "../components/ImageField";

const blank = { name: "", logo: "", featured: false };

export default function Brands() {
  const { data, error, loading, reload } = useAsync(async () => (await brandsApi.list()).data || [], []);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const brands = data || [];

  function openAdd() {
    setForm(blank);
    setModal("add");
  }
  function openEdit(b) {
    setForm({ id: idOf(b), name: b.name, logo: b.logo || "", featured: !!b.featured });
    setModal("edit");
  }
  async function mutate(task, close = true) {
    setSaving(true);
    try {
      await task();
      await reload();
      if (close) setModal(null);
    } catch (e) {
      alert(e?.message || "Request failed");
    } finally {
      setSaving(false);
    }
  }
  async function save() {
    const body = { name: form.name, logo: form.logo, featured: form.featured };
    await mutate(() => (modal === "edit" ? brandsApi.update(form.id, body) : brandsApi.create(body)));
  }
  async function remove(id) {
    if (confirm("Delete this brand?")) await mutate(() => brandsApi.remove(id), false);
  }
  async function toggleFeatured(b) {
    await mutate(() => brandsApi.update(idOf(b), { featured: !b.featured }), false);
  }

  if (loading && !data) return <LoadingState label="Loading brands…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Brands"
        description="Manage brand listings and control which brands are featured on the homepage."
        action={
          <Button onClick={openAdd}>
            <Plus size={14} /> Add brand
          </Button>
        }
      />
      {!brands.length ? (
        <Card>
          <EmptyState title="No brands yet" action={<Button onClick={openAdd}>Add brand</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {brands.map((b) => (
            <Card key={idOf(b)} className="p-4">
              <div className="flex items-start justify-between mb-3">
                {b.logo ? (
                  <img src={mediaUrl(b.logo)} alt="" className="w-11 h-11 rounded-md object-contain bg-primary-light" />
                ) : (
                  <div className="w-11 h-11 rounded-md bg-primary-light text-primary-dark flex items-center justify-center font-display font-semibold">
                    {b.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 text-muted">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(idOf(b))} className="p-1.5 text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="font-medium text-ink">{b.name}</div>
              <div className="text-xs text-muted mb-3">{b.productCount || 0} products</div>
              <button
                onClick={() => toggleFeatured(b)}
                disabled={saving}
                className={`flex items-center gap-1.5 text-xs font-medium ${b.featured ? "text-amber" : "text-muted"}`}
              >
                <Star size={13} fill={b.featured ? "currentColor" : "none"} /> {b.featured ? "Featured on homepage" : "Feature on homepage"}
              </button>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "edit" ? "Edit brand" : "Add brand"}>
        <Field label="Brand name">
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        </Field>
        <ImageField label="Brand logo" folder="brands" value={form.logo} onChange={(logo) => setForm({ ...form, logo })} />
        <label className="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Feature on homepage
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : "Save brand"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
