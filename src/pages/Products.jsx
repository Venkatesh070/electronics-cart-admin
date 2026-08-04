import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { brandsApi, categoriesApi, productsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { downloadCsv, formatINR, idOf, mediaUrl, nameOf, titleCase } from "../utils/format";
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader, SearchInput, Select, Table } from "../components/ui";

function primaryImage(images = []) {
  if (!Array.isArray(images) || !images.length) return "";
  const primary = images.find((img) => img?.isPrimary) || images[0];
  return typeof primary === "string" ? primary : primary?.url || "";
}

export default function Products() {
  const navigate = useNavigate();
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

  async function mutate(task) {
    setSaving(true);
    try {
      await task();
      await reload();
      setSelected([]);
    } catch (e) {
      alert(e?.message || "Request failed");
    } finally {
      setSaving(false);
    }
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
            <Button onClick={() => navigate("/products/new")}>
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
              <Button size="sm" variant="secondary" disabled={saving} onClick={() => bulkAction("ACTIVE")}>
                Activate
              </Button>
              <Button size="sm" variant="secondary" disabled={saving} onClick={() => bulkAction("INACTIVE")}>
                Deactivate
              </Button>
              <Button size="sm" variant="danger" disabled={saving} onClick={() => bulkAction("delete")}>
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
                      {Array.isArray(r.variants) && r.variants.length
                        ? ` · ${r.variants.length} variant${r.variants.length === 1 ? "" : "s"}`
                        : ""}
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
                <span className={Number(r.stock) <= 0 ? "text-danger font-medium" : r.stock <= (r.minStock || 5) ? "text-amber font-medium" : ""}>
                  {Number(r.stock) <= 0 ? "Out of stock (0)" : r.stock}
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
                      navigate(`/products/${r.id}/edit`);
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
          onRowClick={(r) => navigate(`/products/${r.id}/edit`)}
        />
      </Card>
    </div>
  );
}
