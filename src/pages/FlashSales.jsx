import { useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import { flashSalesApi, productsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, idOf, nameOf } from "../utils/format";
import { Badge, Button, Card, EmptyState, ErrorState, Field, inputCls, LoadingState, Modal, PageHeader } from "../components/ui";

const blank = { name: "", productId: "", discountPercent: "", stockCap: "", startsAt: "", endsAt: "" };

function saleStatus(s) {
  const now = Date.now();
  if (!s.active || now > new Date(s.endsAt).getTime()) return "Ended";
  if (now < new Date(s.startsAt).getTime()) return "Scheduled";
  return "Live";
}

export default function FlashSales() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [sales, products] = await Promise.all([flashSalesApi.list(), productsApi.list({ status: "all", limit: 100 })]);
    return { sales: sales.data || [], products: products.data || [] };
  }, []);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const sales = data?.sales || [];
  const products = data?.products || [];
  function openCreate() { setForm({ ...blank, productId: idOf(products[0]) }); setModal(true); }
  async function create() {
    setSaving(true);
    try {
      await flashSalesApi.create({ name: form.name, products: [{ product: form.productId, discountPercent: Number(form.discountPercent), stockCap: Number(form.stockCap) }], startsAt: form.startsAt, endsAt: form.endsAt, active: true });
      await reload(); setModal(false); setForm(blank);
    } catch (e) { alert(e?.message || "Could not create flash sale"); }
    finally { setSaving(false); }
  }
  async function remove(id) {
    if (!confirm("Delete this flash sale?")) return;
    try { await flashSalesApi.remove(id); await reload(); } catch (e) { alert(e?.message || "Could not delete flash sale"); }
  }
  if (loading && !data) return <LoadingState label="Loading flash sales…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return <div>
    <PageHeader eyebrow="Sales" title="Flash Sales" description="Create time-boxed sales with stock caps and track live performance." action={<Button onClick={openCreate}><Plus size={14} /> Create flash sale</Button>} />
    {!sales.length ? <Card><EmptyState icon={Zap} title="No flash sales" description="Create a time-boxed promotion for a product." action={<Button onClick={openCreate}>Create flash sale</Button>} /></Card> :
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{sales.map((s) => {
        const lines = s.products || [];
        const sold = lines.reduce((sum, p) => sum + (Number(p.soldCount) || 0), 0);
        const cap = lines.reduce((sum, p) => sum + (Number(p.stockCap) || 0), 0);
        const status = saleStatus(s);
        const discounts = lines.map((p) => Number(p.discountPercent)).filter(Number.isFinite);
        return <Card key={idOf(s)} className="p-5">
          <div className="flex items-start justify-between mb-3"><div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-amber-light text-amber flex items-center justify-center"><Zap size={16} /></div>
            <div><div className="font-medium text-ink">{s.name}</div><div className="text-xs text-muted">{lines.length} products · {discounts.length ? `Up to ${Math.max(...discounts)}% off` : "—"}</div></div>
          </div><div className="flex items-center gap-2"><Badge tone={status === "Live" ? "success" : status === "Scheduled" ? "amber" : "neutral"}>{status}</Badge><button onClick={() => remove(idOf(s))} className="p-1 text-muted hover:text-danger"><Trash2 size={14} /></button></div></div>
          <div className="text-xs text-muted mb-1.5">Stock sold: {sold}/{cap}</div>
          <div className="h-2 bg-bg rounded-full overflow-hidden mb-3"><div className="h-full bg-amber" style={{ width: `${cap ? Math.min(100, sold / cap * 100) : 0}%` }} /></div>
          <div className="flex justify-between text-xs font-mono text-muted"><span>{formatDate(s.startsAt)}</span><span>→</span><span>{formatDate(s.endsAt)}</span></div>
        </Card>;
      })}</div>}
    <Modal open={modal} onClose={() => setModal(false)} title="Create flash sale">
      <Field label="Sale name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Product"><select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>{products.map((p) => <option key={idOf(p)} value={idOf(p)}>{nameOf(p)}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="Discount percent"><input type="number" min="0" max="100" className={inputCls} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} /></Field>
        <Field label="Stock cap"><input type="number" min="0" className={inputCls} value={form.stockCap} onChange={(e) => setForm({ ...form, stockCap: e.target.value })} /></Field>
        <Field label="Start"><input type="datetime-local" className={inputCls} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
        <Field label="End"><input type="datetime-local" className={inputCls} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={create} disabled={saving || !form.name || !form.productId || !form.startsAt || !form.endsAt}>{saving ? "Creating…" : "Create sale"}</Button></div>
    </Modal>
  </div>;
}
