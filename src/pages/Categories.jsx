import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { categoriesApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf, mediaUrl } from "../utils/format";
import { Badge, Button, Card, EmptyState, ErrorState, Field, inputCls, LoadingState, Modal, PageHeader } from "../components/ui";
import ImageField from "../components/ImageField";

function asTree(items) {
  if ((items || []).some((c) => Array.isArray(c.children))) return items;
  const roots = (items || []).filter((c) => !c.parent);
  return roots.map((c) => ({ ...c, children: items.filter((x) => idOf(x.parent) === idOf(c)) }));
}

export default function Categories() {
  const { data, error, loading, reload } = useAsync(async () => (await categoriesApi.tree()).data || [], []);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", parent: "", image: "" });
  const [saving, setSaving] = useState(false);
  const cats = asTree(data || []);

  function openAdd(parent = "") {
    setForm({ name: "", parent, image: "" });
    setModal("add");
  }
  function openEdit(category) {
    setForm({ id: idOf(category), name: category.name, parent: idOf(category.parent), image: category.image || "" });
    setModal("edit");
  }
  async function mutate(task) {
    setSaving(true);
    try {
      await task();
      await reload();
      setModal(null);
    } catch (e) {
      alert(e?.message || "Request failed");
    } finally {
      setSaving(false);
    }
  }
  async function save() {
    const payload = { name: form.name, image: form.image || undefined };
    await mutate(() =>
      modal === "edit"
        ? categoriesApi.update(form.id, payload)
        : categoriesApi.create({ ...payload, ...(form.parent ? { parent: form.parent } : {}) })
    );
  }
  async function remove(id) {
    if (confirm("Delete this category?")) await mutate(() => categoriesApi.remove(id));
  }
  async function move(index, direction) {
    const next = [...cats];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await mutate(() => categoriesApi.reorder(next.map((c, order) => ({ id: idOf(c), order }))));
  }

  function thumb(item) {
    if (item.image) {
      return <img src={mediaUrl(item.image)} alt="" className="w-10 h-10 rounded-md object-cover bg-bg border border-border" />;
    }
    return (
      <div className="w-10 h-10 rounded-md bg-primary-light flex items-center justify-center text-primary-dark font-display font-semibold text-sm">
        {item.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  if (loading && !data) return <LoadingState label="Loading categories…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Manage the category tree, subcategories, and how they appear in navigation."
        action={
          <Button onClick={() => openAdd()}>
            <Plus size={14} /> Add category
          </Button>
        }
      />
      {!cats.length ? (
        <Card>
          <EmptyState
            title="No categories yet"
            description="Create the first category for your catalog."
            action={<Button onClick={() => openAdd()}>Add category</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {cats.map((c, i) => (
            <Card key={idOf(c)} className="p-4">
              <div className="flex items-center gap-3">
                <GripVertical size={15} className="text-muted" />
                {thumb(c)}
                <div className="flex-1">
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="text-xs text-muted">
                    {c.productCount || 0} products · {c.children?.length || 0} subcategories
                  </div>
                </div>
                <Badge tone="primary">Top level</Badge>
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-muted disabled:opacity-30">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="p-1.5 text-muted disabled:opacity-30">
                    <ChevronDown size={14} />
                  </button>
                  <button onClick={() => openAdd(idOf(c))} className="p-1.5 text-muted">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => openEdit(c)} className="p-1.5 text-muted">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(idOf(c))} className="p-1.5 text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {!!c.children?.length && (
                <div className="mt-3 ml-[3.25rem] flex flex-col gap-1.5 border-l border-border pl-4">
                  {c.children.map((sc) => (
                    <div key={idOf(sc)} className="flex items-center gap-3 py-1.5">
                      {thumb(sc)}
                      <span className="text-sm flex-1">{sc.name}</span>
                      <span className="text-xs text-muted">{sc.productCount || 0} products</span>
                      <button onClick={() => openEdit(sc)} className="p-1 text-muted">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => remove(idOf(sc))} className="p-1 text-muted hover:text-danger">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "edit" ? "Edit category" : form.parent ? "Add subcategory" : "Add category"}>
        <Field label="Name">
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        </Field>
        {modal === "add" && (
          <Field label="Parent category">
            <select className={inputCls} value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">— None (top level) —</option>
              {cats.map((c) => (
                <option key={idOf(c)} value={idOf(c)}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <ImageField label="Category image" folder="categories" value={form.image} onChange={(image) => setForm({ ...form, image })} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : "Save category"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
