import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { shippingApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatINR, idOf } from "../utils/format";
import { PageHeader, Card, Button, Table, Badge, Modal, Field, inputCls, LoadingState, ErrorState } from "../components/ui";

const blank = { name: "", regions: "", baseRate: "", freeShippingThreshold: "", courierPartner: "", active: true };

export default function Shipping() {
  const { data, loading, error, reload } = useAsync(() => shippingApi.list(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  function show(zone) {
    setEditing(zone || null);
    setForm(zone ? {
      name: zone.name || "",
      regions: (zone.regions || []).join(", "),
      baseRate: String(zone.baseRate ?? ""),
      freeShippingThreshold: String(zone.freeShippingThreshold ?? ""),
      courierPartner: zone.courierPartner || "",
      active: zone.active !== false,
    } : blank);
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        regions: form.regions.split(",").map((value) => value.trim()).filter(Boolean),
        baseRate: Number(form.baseRate),
        active: form.active,
        ...(form.freeShippingThreshold !== "" ? { freeShippingThreshold: Number(form.freeShippingThreshold) } : {}),
        ...(form.courierPartner.trim() ? { courierPartner: form.courierPartner.trim() } : {}),
      };
      if (editing) await shippingApi.update(idOf(editing), body);
      else await shippingApi.create(body);
      setOpen(false);
      await reload();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(zone) {
    try {
      await shippingApi.update(idOf(zone), { active: !zone.active });
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function remove(zone) {
    if (!window.confirm(`Delete ${zone.name}?`)) return;
    try {
      await shippingApi.remove(idOf(zone));
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Shipping" description="Manage delivery zones, rates and courier partners." action={<Button onClick={() => show()}><Plus size={14} /> Add zone</Button>} />
      {loading ? <LoadingState label="Loading shipping zones…" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <Card className="p-4">
          <Table rows={data?.data || []} columns={[
            { key: "name", label: "Zone" },
            { key: "regions", label: "Regions", render: (r) => (r.regions || []).join(", ") || "—" },
            { key: "baseRate", label: "Base rate", render: (r) => formatINR(r.baseRate) },
            { key: "freeShippingThreshold", label: "Free above", render: (r) => r.freeShippingThreshold == null ? "—" : formatINR(r.freeShippingThreshold) },
            { key: "courierPartner", label: "Courier", render: (r) => r.courierPartner || "—" },
            { key: "active", label: "Status", render: (r) => <button onClick={() => toggle(r)}><Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Active" : "Inactive"}</Badge></button> },
            { key: "actions", label: "", render: (r) => <div className="flex gap-1"><button className="p-1.5 text-muted hover:text-primary" onClick={() => show(r)}><Pencil size={14} /></button><button className="p-1.5 text-muted hover:text-danger" onClick={() => remove(r)}><Trash2 size={14} /></button></div> },
          ]} />
        </Card>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit shipping zone" : "Add shipping zone"}>
        <form onSubmit={save}>
          <Field label="Name"><input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Regions (comma-separated)"><input required className={inputCls} value={form.regions} onChange={(e) => setForm({ ...form, regions: e.target.value })} /></Field>
          <Field label="Base rate"><input required min="0" type="number" className={inputCls} value={form.baseRate} onChange={(e) => setForm({ ...form, baseRate: e.target.value })} /></Field>
          <Field label="Free shipping threshold (optional)"><input min="0" type="number" className={inputCls} value={form.freeShippingThreshold} onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })} /></Field>
          <Field label="Courier partner (optional)"><input className={inputCls} value={form.courierPartner} onChange={(e) => setForm({ ...form, courierPartner: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm mb-5"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save zone"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
