import { useState } from "react";
import { AlertTriangle, ArrowDownUp } from "lucide-react";
import { PageHeader, Card, Table, Badge, SearchInput, Select, useSearchFilter, Button, Modal, Field, inputCls } from "../components/ui";
import { products as seed } from "../data/products";

const warehouses = ["Hyderabad DC", "Bengaluru DC", "Mumbai DC"];

export default function Inventory() {
  const [products, setProducts] = useState(seed.map((p, i) => ({ ...p, warehouse: warehouses[i % 3], threshold: 8 })));
  const [filtered, q, setQ] = useSearchFilter(products, ["name", "sku"]);
  const [wh, setWh] = useState("All");
  const [modal, setModal] = useState(null);
  const [adjust, setAdjust] = useState("0");

  const rows = filtered.filter((p) => wh === "All" || p.warehouse === wh);
  const lowStockCount = products.filter((p) => p.stock <= p.threshold).length;

  function applyAdjust() {
    setProducts(products.map((p) => p.id === modal.id ? { ...p, stock: Math.max(0, p.stock + Number(adjust)) } : p));
    setModal(null); setAdjust("0");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Inventory"
        description="Stock levels across warehouses, adjustment history, and low-stock thresholds."
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="p-4"><div className="text-xs text-muted mb-1">Total units in stock</div><div className="font-display text-2xl font-semibold">{products.reduce((s, p) => s + p.stock, 0)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted mb-1">SKUs tracked</div><div className="font-display text-2xl font-semibold">{products.length}</div></Card>
        <Card className="p-4 border-amber/30">
          <div className="text-xs text-muted mb-1 flex items-center gap-1"><AlertTriangle size={12} className="text-amber" /> Below threshold</div>
          <div className="font-display text-2xl font-semibold text-amber">{lowStockCount}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search SKU or product…" />
          <Select value={wh} onChange={setWh} options={["All", ...warehouses]} />
        </div>
        <Table
          columns={[
            { key: "name", label: "Product", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted font-mono">{r.sku}</div></div> },
            { key: "warehouse", label: "Warehouse" },
            { key: "stock", label: "In stock", render: (r) => <span className={r.stock <= r.threshold ? "text-amber font-semibold" : "font-medium"}>{r.stock}</span> },
            { key: "threshold", label: "Low-stock threshold", render: (r) => <span className="text-muted font-mono">{r.threshold}</span> },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.stock === 0 ? "danger" : r.stock <= r.threshold ? "amber" : "success"}>{r.stock === 0 ? "Out of stock" : r.stock <= r.threshold ? "Reorder soon" : "Healthy"}</Badge> },
            { key: "action", label: "", render: (r) => <Button size="sm" variant="secondary" onClick={() => setModal(r)}><ArrowDownUp size={12} /> Adjust</Button> },
          ]}
          rows={rows}
        />
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={`Adjust stock — ${modal?.name ?? ""}`}>
        <p className="text-sm text-muted mb-3">Current stock: <span className="font-medium text-ink">{modal?.stock}</span> units at {modal?.warehouse}</p>
        <Field label="Adjustment (use negative to remove stock)">
          <input type="number" className={inputCls} value={adjust} onChange={(e) => setAdjust(e.target.value)} />
        </Field>
        <Field label="Reason">
          <select className={inputCls}><option>Stock received</option><option>Damaged / written off</option><option>Manual recount</option><option>Transferred to another warehouse</option></select>
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="primary" onClick={applyAdjust}>Apply adjustment</Button>
        </div>
      </Modal>
    </div>
  );
}
