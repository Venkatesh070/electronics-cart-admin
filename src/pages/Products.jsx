import { useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { brandsApi, categoriesApi, productsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { downloadCsv, formatINR, idOf, mediaUrl, nameOf, titleCase } from "../utils/format";
import { Badge, Button, Card, ErrorState, Field, inputCls, LoadingState, Modal, PageHeader, SearchInput, Select, Table } from "../components/ui";
import ImageField from "../components/ImageField";

const blank = {
  sku: "",
  name: "",
  slug: "",
  brandId: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  price: "",
  originalPrice: "",
  discount: "0",
  tax: "18",
  stock: "0",
  minStock: "5",
  status: "DRAFT",
  featured: false,
  bestSeller: false,
  newArrival: false,
  warranty: "",
  images: [],
  specifications: [{ key: "", value: "" }],
};

function primaryImage(images = []) {
  if (!Array.isArray(images) || !images.length) return "";
  const primary = images.find((img) => img?.isPrimary) || images[0];
  return typeof primary === "string" ? primary : primary?.url || "";
}

function mapSpecs(specs) {
  if (!Array.isArray(specs)) return [{ key: "", value: "" }];
  if (!specs.length) return [{ key: "", value: "" }];
  return specs.map((s) => ({ key: s.key || "", value: s.value || "" }));
}

export default function Products() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [p, c, b] = await Promise.all([
      productsApi.list({ status: "all", limit: 100 }),
      categoriesApi.list(),
      brandsApi.list(),
    ]);
    return { products: p.data || [], categories: c.data || [], brands: b.data || [] };
  }, []);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const products = (data?.products || []).map((p) => ({
    ...p,
    id: idOf(p),
    brand: nameOf(p.brand),
    brandId: idOf(p.brand),
    category: nameOf(p.category),
    categoryId: idOf(p.category),
    sku: p.sku || "",
    finalPrice: p.price,
    status: p.status,
    stock: Number(p.stock) || 0,
    rating: p.ratingsAverage,
    image: primaryImage(p.images),
    images: Array.isArray(p.images)
      ? p.images.map((img, i) =>
          typeof img === "string" ? { url: img, isPrimary: i === 0 } : { url: img.url, isPrimary: !!img.isPrimary }
        )
      : [],
  }));

  const rows = products.filter((p) => {
    const matchesSearch =
      !q.trim() ||
      [p.name, p.sku, p.brand, p.slug].some((v) => String(v || "").toLowerCase().includes(q.toLowerCase()));
    return (
      matchesSearch &&
      (catFilter === "All" || p.categoryId === catFilter) &&
      (statusFilter === "All" || p.status === statusFilter)
    );
  });

  function openAdd() {
    setForm({
      ...blank,
      categoryId: idOf(data?.categories?.[0]),
      brandId: idOf(data?.brands?.[0]),
      images: [],
      specifications: [{ key: "", value: "" }],
    });
    setModal({ mode: "add" });
  }

  function openEdit(p) {
    setForm({
      id: p.id,
      sku: p.sku || "",
      name: p.name || "",
      slug: p.slug || "",
      brandId: p.brandId,
      categoryId: p.categoryId,
      shortDescription: p.shortDescription || "",
      description: p.description || "",
      price: p.price ?? "",
      originalPrice: p.originalPrice ?? "",
      discount: p.discount ?? 0,
      tax: p.tax ?? 18,
      stock: p.stock ?? 0,
      minStock: p.minStock ?? 5,
      status: p.status || "DRAFT",
      featured: !!p.featured,
      bestSeller: !!p.bestSeller,
      newArrival: !!p.newArrival,
      warranty: p.warranty || "",
      images: p.images || [],
      specifications: mapSpecs(p.specifications),
    });
    setModal({ mode: "edit" });
  }

  async function mutate(task) {
    setSaving(true);
    try {
      await task();
      await reload();
      setModal(null);
      setSelected([]);
    } catch (e) {
      alert(e?.message || "Request failed");
    } finally {
      setSaving(false);
    }
  }

  function buildBody() {
    const specs = (form.specifications || [])
      .map((s) => ({ key: s.key.trim(), value: s.value.trim() }))
      .filter((s) => s.key && s.value);

    return {
      sku: form.sku.trim(),
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      categoryId: form.categoryId,
      brandId: form.brandId,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim() || form.shortDescription.trim() || form.name.trim(),
      price: Number(form.price),
      originalPrice: form.originalPrice === "" ? undefined : Number(form.originalPrice),
      discount: Number(form.discount) || 0,
      tax: Number(form.tax) || 0,
      stock: Number(form.stock) || 0,
      minStock: Number(form.minStock) || 0,
      status: form.status,
      featured: !!form.featured,
      bestSeller: !!form.bestSeller,
      newArrival: !!form.newArrival,
      warranty: form.warranty.trim() || undefined,
      images: form.images || [],
      specifications: specs,
    };
  }

  async function save() {
    const body = buildBody();
    if (!body.sku || !body.name || !body.categoryId || !body.brandId || Number.isNaN(body.price)) {
      alert("SKU, name, brand, category and price are required");
      return;
    }
    await mutate(() => (modal.mode === "add" ? productsApi.create(body) : productsApi.update(form.id, body)));
  }

  async function remove(id) {
    if (confirm("Delete this product?")) await mutate(() => productsApi.remove(id));
  }

  async function bulkAction(action) {
    if (!selected.length) return;
    if (action === "delete" && !confirm(`Delete ${selected.length} products?`)) return;
    await mutate(() =>
      action === "delete" ? productsApi.bulkDelete(selected) : productsApi.bulkStatus(selected, action)
    );
  }

  function updateSpec(index, key, value) {
    const next = [...form.specifications];
    next[index] = { ...next[index], [key]: value };
    setForm({ ...form, specifications: next });
  }

  if (loading && !data) return <LoadingState label="Loading products…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description={`${products.length} products across ${data?.categories?.length || 0} categories.`}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  "products.csv",
                  rows.map(({ id, sku, name, brand, category, finalPrice, stock, status }) => ({
                    id,
                    sku,
                    name,
                    brand,
                    category,
                    price: finalPrice,
                    stock,
                    status,
                  }))
                )
              }
            >
              <Download size={14} /> Export
            </Button>
            <Button onClick={openAdd}>
              <Plus size={14} /> Add product
            </Button>
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name, SKU, brand…" />
          <Select
            value={catFilter}
            onChange={setCatFilter}
            options={[
              { value: "All", label: "All categories" },
              ...(data?.categories || []).map((c) => ({ value: idOf(c), label: c.name })),
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={["All", "ACTIVE", "DRAFT", "INACTIVE"].map((value) => ({
              value,
              label: value === "All" ? value : titleCase(value),
            }))}
          />
          {!!selected.length && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-muted">{selected.length} selected</span>
              <Button size="sm" variant="secondary" onClick={() => bulkAction("ACTIVE")}>
                Activate
              </Button>
              <Button size="sm" variant="secondary" onClick={() => bulkAction("INACTIVE")}>
                Deactivate
              </Button>
              <Button size="sm" variant="danger" onClick={() => bulkAction("delete")}>
                Delete
              </Button>
            </div>
          )}
        </div>

        <Table
          rows={rows}
          empty="No products found."
          columns={[
            {
              key: "sel",
              label: (
                <input
                  type="checkbox"
                  checked={rows.length > 0 && rows.every((r) => selected.includes(r.id))}
                  onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                />
              ),
              render: (r) => (
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    setSelected((s) => (s.includes(r.id) ? s.filter((id) => id !== r.id) : [...s, r.id]))
                  }
                />
              ),
            },
            {
              key: "name",
              label: "Product",
              render: (r) => (
                <div className="flex items-center gap-3">
                  {r.image ? (
                    <img src={mediaUrl(r.image)} alt="" className="w-10 h-10 rounded-md object-cover bg-bg border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-bg border border-border" />
                  )}
                  <div>
                    <div className="font-medium text-ink">{r.name}</div>
                    <div className="text-xs text-muted font-mono">
                      {r.sku || "—"}
                      {r.featured ? " · Featured" : ""}
                      {r.bestSeller ? " · Bestseller" : ""}
                    </div>
                  </div>
                </div>
              ),
            },
            { key: "brand", label: "Brand" },
            { key: "category", label: "Category" },
            {
              key: "price",
              label: "Price",
              render: (r) => (
                <div>
                  <div className="font-mono">{formatINR(r.finalPrice)}</div>
                  {r.originalPrice > r.finalPrice && (
                    <div className="text-xs text-muted line-through font-mono">{formatINR(r.originalPrice)}</div>
                  )}
                </div>
              ),
            },
            {
              key: "stock",
              label: "Stock",
              render: (r) => (
                <span className={r.stock === 0 ? "text-danger font-medium" : r.stock <= (r.minStock || 5) ? "text-amber font-medium" : ""}>
                  {r.stock}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <Badge tone={r.status === "ACTIVE" ? "success" : r.status === "DRAFT" ? "amber" : "neutral"}>
                  {r.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(r);
                    }}
                    className="p-1.5 rounded hover:bg-bg text-muted"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(r.id);
                    }}
                    className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            },
          ]}
          onRowClick={openEdit}
        />
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Add product" : "Edit product"}
        width="max-w-3xl"
      >
        <div className="grid grid-cols-2 gap-x-4 max-h-[70vh] overflow-y-auto pr-1">
          <Field label="SKU">
            <input className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="LAP-DELL-001" />
          </Field>
          <Field label="Slug (optional)">
            <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" />
          </Field>
          <Field label="Product name" className="col-span-2">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Brand">
            <select className={inputCls} value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
              {(data?.brands || []).map((b) => (
                <option key={idOf(b)} value={idOf(b)}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select className={inputCls} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {(data?.categories || []).map((c) => (
                <option key={idOf(c)} value={idOf(c)}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Short description" className="col-span-2">
            <input
              className={inputCls}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="15.6-inch Intel Core i7 Laptop"
            />
          </Field>
          <Field label="Full description" className="col-span-2">
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Price (₹)">
            <input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field label="Original price (₹)">
            <input
              type="number"
              className={inputCls}
              value={form.originalPrice}
              onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
            />
          </Field>
          <Field label="Discount (%)">
            <input type="number" className={inputCls} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </Field>
          <Field label="Tax (%)">
            <input type="number" className={inputCls} value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
          </Field>
          <Field label="Stock">
            <input type="number" className={inputCls} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </Field>
          <Field label="Min stock">
            <input type="number" className={inputCls} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </Field>
          <Field label="Warranty">
            <input className={inputCls} value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="2 Years" />
          </Field>
          <div className="col-span-2 flex flex-wrap gap-4 mb-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })} /> Best seller
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.newArrival} onChange={(e) => setForm({ ...form, newArrival: e.target.checked })} /> New arrival
            </label>
          </div>

          <div className="col-span-2">
            <ImageField
              label="Product images"
              folder="products"
              objectMode
              multiple
              value={form.images}
              onChange={(images) => setForm({ ...form, images })}
            />
          </div>

          <div className="col-span-2 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted">Specifications</label>
              <button
                type="button"
                className="text-xs text-primary font-medium"
                onClick={() => setForm({ ...form, specifications: [...form.specifications, { key: "", value: "" }] })}
              >
                + Add row
              </button>
            </div>
            <div className="space-y-2">
              {form.specifications.map((spec, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    className={inputCls}
                    placeholder="Key (e.g. Processor)"
                    value={spec.key}
                    onChange={(e) => updateSpec(i, "key", e.target.value)}
                  />
                  <input
                    className={inputCls}
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => updateSpec(i, "value", e.target.value)}
                  />
                  <button
                    type="button"
                    className="p-2 text-muted hover:text-danger"
                    onClick={() =>
                      setForm({
                        ...form,
                        specifications: form.specifications.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.name || !form.sku || !form.categoryId || !form.brandId}>
            {saving ? "Saving…" : modal?.mode === "add" ? "Add product" : "Save changes"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
