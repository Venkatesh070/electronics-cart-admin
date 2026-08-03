import { useState } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { PageHeader, Card, Button, Table, Badge, SearchInput, Select, Modal, Field, inputCls, useSearchFilter } from "../components/ui";
import { products as seedProducts } from "../data/products";
import { categories } from "../data/categories";
import { brands } from "../data/brands";

const emptyForm = { name: "", brand: brands[0].name, category: "Ultrabooks", price: "", discount: "0", stock: "0", status: "Draft", condition: "New" };

export default function Products() {
  const [products, setProducts] = useState(seedProducts);
  const [filtered, q, setQ] = useSearchFilter(products, ["name", "sku", "brand"]);
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit', product }
  const [form, setForm] = useState(emptyForm);

  const rows = filtered.filter(
    (p) => (catFilter === "All" || p.category === catFilter) && (statusFilter === "All" || p.status === statusFilter)
  );

  function openAdd() { setForm(emptyForm); setModal({ mode: "add" }); }
  function openEdit(p) { setForm(p); setModal({ mode: "edit" }); }

  function save() {
    if (modal.mode === "add") {
      const id = `p${Date.now()}`;
      setProducts([{ ...form, id, sku: `EC-NEW-${products.length + 1}`, finalPrice: Math.round(form.price * (1 - form.discount / 100)), rating: 0, reviewCount: 0 }, ...products]);
    } else {
      setProducts(products.map((p) => (p.id === form.id ? { ...form, finalPrice: Math.round(form.price * (1 - form.discount / 100)) } : p)));
    }
    setModal(null);
  }

  function remove(id) { setProducts(products.filter((p) => p.id !== id)); setSelected(selected.filter((s) => s !== id)); }

  function toggleAll(e) { setSelected(e.target.checked ? rows.map((r) => r.id) : []); }
  function toggleOne(id) { setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]); }

  function bulkAction(action) {
    if (action === "archive") setProducts(products.map((p) => (selected.includes(p.id) ? { ...p, status: "Archived" } : p)));
    if (action === "publish") setProducts(products.map((p) => (selected.includes(p.id) ? { ...p, status: "Published" } : p)));
    if (action === "delete") setProducts(products.filter((p) => !selected.includes(p.id)));
    setSelected([]);
  }

  const allCats = ["All", ...new Set(products.map((p) => p.category))];

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description={`${products.length} products across ${allCats.length - 1} categories.`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary"><Download size={14} /> Export</Button>
            <Button variant="primary" onClick={openAdd}><Plus size={14} /> Add product</Button>
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name, SKU, brand…" />
          <Select value={catFilter} onChange={setCatFilter} options={allCats} />
          <Select value={statusFilter} onChange={setStatusFilter} options={["All", "Published", "Draft", "Archived", "Out of Stock"]} />
          {selected.length > 0 && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-muted">{selected.length} selected</span>
              <Button size="sm" variant="secondary" onClick={() => bulkAction("publish")}>Publish</Button>
              <Button size="sm" variant="secondary" onClick={() => bulkAction("archive")}>Archive</Button>
              <Button size="sm" variant="danger" onClick={() => bulkAction("delete")}>Delete</Button>
            </div>
          )}
        </div>

        <Table
          columns={[
            { key: "sel", label: <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={toggleAll} />,
              render: (r) => <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} onClick={(e) => e.stopPropagation()} /> },
            { key: "name", label: "Product", render: (r) => (
                <div>
                  <div className="font-medium text-ink">{r.name}</div>
                  <div className="text-xs text-muted font-mono">{r.sku} · {r.condition}</div>
                </div>
              ) },
            { key: "brand", label: "Brand" },
            { key: "category", label: "Category" },
            { key: "price", label: "Price", render: (r) => (
                <div>
                  <div className="font-mono text-ink">₹{Number(r.finalPrice).toLocaleString("en-IN")}</div>
                  {r.discount > 0 && <div className="text-xs text-muted line-through font-mono">₹{Number(r.price).toLocaleString("en-IN")}</div>}
                </div>
              ) },
            { key: "stock", label: "Stock", render: (r) => (
                <span className={r.stock === 0 ? "text-danger font-medium" : r.stock <= 6 ? "text-amber font-medium" : "text-ink"}>{r.stock}</span>
              ) },
            { key: "status", label: "Status", render: (r) => (
                <Badge tone={r.status === "Published" ? "success" : r.status === "Draft" ? "amber" : r.status === "Out of Stock" ? "danger" : "neutral"}>{r.status}</Badge>
              ) },
            { key: "actions", label: "", render: (r) => (
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded hover:bg-bg text-muted hover:text-ink"><Pencil size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); remove(r.id); }} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"><Trash2 size={14} /></button>
                </div>
              ) },
          ]}
          rows={rows}
          onRowClick={openEdit}
        />
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add product" : "Edit product"} width="max-w-2xl">
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Product name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Brand">
            <select className={inputCls} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
              {brands.map((b) => <option key={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.flatMap((c) => c.children).map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Condition">
            <select className={inputCls} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              <option>New</option><option>Refurbished</option>
            </select>
          </Field>
          <Field label="Price (₹)">
            <input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field label="Discount (%)">
            <input type="number" className={inputCls} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </Field>
          <Field label="Stock quantity">
            <input type="number" className={inputCls} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Draft</option><option>Published</option><option>Archived</option>
            </select>
          </Field>
        </div>
        <Field label="Specifications">
          <textarea className={inputCls} rows={3} placeholder="RAM, storage, screen size, processor…" />
        </Field>
        <Field label="SEO — meta title & description">
          <input className={inputCls + " mb-2"} placeholder="Meta title" />
          <textarea className={inputCls} rows={2} placeholder="Meta description" />
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="primary" onClick={save}>{modal?.mode === "add" ? "Add product" : "Save changes"}</Button>
        </div>
      </Modal>
    </div>
  );
}
