import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { couponsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, formatINR, idOf, titleCase } from "../utils/format";
import { Badge, Button, Card, ErrorState, Field, inputCls, LoadingState, Modal, PageHeader, Table } from "../components/ui";

const blank = { code: "", type: "flat", value: "", minOrderValue: "", usageLimit: "", validFrom: "", validTo: "", active: true };

function couponStatus(c) {
  if (!c.active) return "inactive";
  const now = Date.now();
  if (c.validTo && now > new Date(c.validTo).getTime()) return "expired";
  if (c.validFrom && now < new Date(c.validFrom).getTime()) return "scheduled";
  return c.status || "active";
}

export default function Coupons() {
  const { data, error, loading, reload } = useAsync(async () => (await couponsApi.list()).data || [], []);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const coupons = data || [];
  async function save() {
    setSaving(true);
    try {
      await couponsApi.create({ code: form.code, type: form.type, value: Number(form.value), validFrom: form.validFrom, validTo: form.validTo, minOrderValue: Number(form.minOrderValue), usageLimit: Number(form.usageLimit), active: form.active });
      await reload(); setModal(false); setForm(blank);
    } catch (e) { alert(e?.message || "Could not create coupon"); }
    finally { setSaving(false); }
  }
  async function remove(id) {
    if (!confirm("Delete this coupon?")) return;
    try { await couponsApi.remove(id); await reload(); } catch (e) { alert(e?.message || "Could not delete coupon"); }
  }
  if (loading && !data) return <LoadingState label="Loading coupons…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return <div>
    <PageHeader eyebrow="Sales" title="Coupons" description="Create and track discount coupons across the storefront." action={<Button onClick={() => setModal(true)}><Plus size={14} /> Create coupon</Button>} />
    <Card className="p-4"><Table rows={coupons} empty="No coupons found." columns={[
      { key: "code", label: "Code", render: (r) => <span className="font-mono font-medium">{r.code}</span> },
      { key: "value", label: "Discount", render: (r) => r.type === "flat" ? `${formatINR(r.value)} off` : `${r.value}% off` },
      { key: "minOrderValue", label: "Min order", render: (r) => formatINR(r.minOrderValue) },
      { key: "usage", label: "Usage", render: (r) => { const used = r.usageCount ?? r.redemptions?.length ?? 0; const limit = Number(r.usageLimit) || 0; return <div className="w-28"><div className="text-xs text-muted mb-1">{used}/{limit || "∞"}</div><div className="h-1.5 bg-bg rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${limit ? Math.min(100, used / limit * 100) : 0}%` }} /></div></div>; } },
      { key: "validTo", label: "Valid till", render: (r) => <span className="font-mono text-xs">{formatDate(r.validTo)}</span> },
      { key: "status", label: "Status", render: (r) => { const status = couponStatus(r); return <Badge tone={status === "active" ? "success" : status === "scheduled" ? "amber" : "neutral"}>{titleCase(status)}</Badge>; } },
      { key: "del", label: "", render: (r) => <button onClick={() => remove(idOf(r))} className="p-1.5 text-muted hover:text-danger"><Trash2 size={14} /></button> },
    ]} /></Card>
    <Modal open={modal} onClose={() => setModal(false)} title="Create coupon">
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="Coupon code"><input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
        <Field label="Discount type"><select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="flat">Flat</option><option value="percent">Percent</option></select></Field>
        <Field label={form.type === "flat" ? "Amount (₹)" : "Percent (%)"}><input type="number" className={inputCls} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
        <Field label="Minimum order value (₹)"><input type="number" className={inputCls} value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} /></Field>
        <Field label="Usage limit"><input type="number" className={inputCls} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></Field>
        <Field label="Valid from"><input type="date" className={inputCls} value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></Field>
        <Field label="Valid till"><input type="date" className={inputCls} value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} /></Field>
      </div>
      <label className="flex gap-2 text-sm mb-4"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save} disabled={saving || !form.code || !form.validFrom || !form.validTo}>{saving ? "Creating…" : "Create coupon"}</Button></div>
    </Modal>
  </div>;
}
