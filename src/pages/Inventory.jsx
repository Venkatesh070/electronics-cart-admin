import { useState } from "react";
import { AlertTriangle, ArrowDownUp, Boxes, Warehouse } from "lucide-react";
import { inventoryApi, productsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf } from "../utils/format";
import { Badge, Button, Card, ErrorState, Field, inputCls, KPICard, LoadingState, Modal, PageHeader, SearchInput, Select, Table } from "../components/ui";

export default function Inventory() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [warehouses, products, lowStock] = await Promise.all([
      inventoryApi.warehouses(),
      productsApi.list({ status: "all", limit: 100 }),
      inventoryApi.lowStock(),
    ]);
    return { warehouses: warehouses.data || [], products: products.data || [], lowStock: lowStock.data || [] };
  }, []);
  const [q, setQ] = useState("");
  const [warehouseId, setWarehouseId] = useState("All");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ change: "0", reason: "Stock received", warehouseId: "", variantSku: "" });
  const [saving, setSaving] = useState(false);
  const lowIds = new Set((data?.lowStock || []).map(idOf));

  const rows = (data?.products || [])
    .flatMap((p) => {
      const productId = idOf(p);
      const variants = Array.isArray(p.variants) ? p.variants : [];
      if (variants.length) {
        return variants.map((v) => {
          const stock = Number(v.stock) || 0;
          const threshold = Number(v.minStock ?? p.minStock) || 0;
          return {
            id: productId,
            productId,
            name: p.name,
            sku: v.sku,
            variantSku: v.sku,
            variantLabel: Object.values(v.attributes || {}).filter(Boolean).join(" · ") || v.sku,
            stock,
            threshold,
            low: stock <= threshold,
            hasVariants: true,
          };
        });
      }
      const stock = Number(p.stock) || 0;
      const threshold = Number(p.minStock ?? p.lowStockThreshold) || 0;
      return [
        {
          id: productId,
          productId,
          name: p.name,
          sku: p.sku || p.slug,
          variantSku: "",
          variantLabel: "",
          stock,
          threshold,
          low: lowIds.has(productId) || stock <= threshold,
          hasVariants: false,
        },
      ];
    })
    .filter(
      (p) =>
        !q.trim() ||
        [p.name, p.sku, p.variantLabel].some((v) => String(v || "").toLowerCase().includes(q.toLowerCase()))
    );

  function openAdjust(row) {
    setModal(row);
    setForm({
      change: "0",
      reason: "Stock received",
      warehouseId: warehouseId === "All" ? "" : warehouseId,
      variantSku: row.variantSku || "",
    });
  }

  async function applyAdjust() {
    setSaving(true);
    try {
      await inventoryApi.adjust({
        productId: modal.productId || modal.id,
        change: Number(form.change),
        reason: form.reason,
        ...(form.warehouseId ? { warehouseId: form.warehouseId } : {}),
        ...(form.variantSku ? { variantSku: form.variantSku } : {}),
      });
      await reload();
      setModal(null);
    } catch (e) {
      alert(e?.message || "Could not adjust stock");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) return <LoadingState label="Loading inventory…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const warehouses = data?.warehouses || [];

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Inventory"
        description="Stock levels across warehouses, adjustment history, and low-stock thresholds."
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPICard
          label="Total units in stock"
          value={rows.reduce((sum, p) => sum + (Number(p.stock) || 0), 0).toLocaleString("en-IN")}
          icon={Boxes}
        />
        <KPICard label="SKUs tracked" value={rows.length} sub={`${warehouses.length} warehouses`} icon={Warehouse} />
        <KPICard
          label="Below threshold"
          value={rows.filter((r) => r.low).length}
          sub="Needs attention"
          subTone="danger"
          icon={AlertTriangle}
        />
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search SKU or product…" />
          <Select
            value={warehouseId}
            onChange={setWarehouseId}
            options={[
              { value: "All", label: "All warehouses" },
              ...warehouses.map((w) => ({ value: idOf(w), label: w.name })),
            ]}
          />
        </div>
        <Table
          rows={rows}
          empty="No inventory found."
          columns={[
            {
              key: "name",
              label: "Product / Variant",
              render: (r) => (
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted font-mono">{r.sku || "—"}</div>
                  {r.variantLabel && <div className="text-xs text-muted">{r.variantLabel}</div>}
                </div>
              ),
            },
            {
              key: "warehouse",
              label: "Warehouse",
              render: () =>
                warehouseId === "All"
                  ? "All warehouses"
                  : warehouses.find((w) => idOf(w) === warehouseId)?.name || "—",
            },
            {
              key: "stock",
              label: "In stock",
              render: (r) => <span className={r.low ? "text-amber font-semibold" : "font-medium"}>{r.stock}</span>,
            },
            {
              key: "threshold",
              label: "Low-stock threshold",
              render: (r) => <span className="text-muted font-mono">{r.threshold}</span>,
            },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <Badge tone={Number(r.stock) <= 0 ? "danger" : r.low ? "amber" : "success"}>
                  {Number(r.stock) <= 0 ? "Out of stock" : r.low ? "Reorder soon" : "Healthy"}
                </Badge>
              ),
            },
            {
              key: "action",
              label: "",
              render: (r) => (
                <Button size="sm" variant="secondary" onClick={() => openAdjust(r)}>
                  <ArrowDownUp size={12} /> Adjust
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <Modal open={!!modal} onClose={() => setModal(null)} title={`Adjust stock — ${modal?.name || ""}`}>
        <p className="text-sm text-muted mb-3">
          {modal?.variantSku ? (
            <>
              Variant <span className="font-mono text-ink">{modal.variantSku}</span> · Current stock:{" "}
              <span className="font-medium text-ink">{modal?.stock}</span>
            </>
          ) : (
            <>
              Current stock: <span className="font-medium text-ink">{modal?.stock}</span> units
            </>
          )}
        </p>
        <Field label="Warehouse (optional)">
          <select
            className={inputCls}
            value={form.warehouseId}
            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
          >
            <option value="">— No warehouse —</option>
            {warehouses.map((w) => (
              <option key={idOf(w)} value={idOf(w)}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Adjustment (use negative to remove stock)">
          <input
            type="number"
            className={inputCls}
            value={form.change}
            onChange={(e) => setForm({ ...form, change: e.target.value })}
          />
        </Field>
        <Field label="Reason">
          <select className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
            <option>Stock received</option>
            <option>Damaged / written off</option>
            <option>Manual recount</option>
            <option>Transferred to another warehouse</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button onClick={applyAdjust} disabled={saving || !form.reason || Number(form.change) === 0}>
            {saving ? "Applying…" : "Apply adjustment"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
