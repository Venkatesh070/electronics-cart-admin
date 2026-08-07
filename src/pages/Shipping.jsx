import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { shippingApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatINR, idOf } from "../utils/format";
import { PageHeader, Card, Button, Table, Badge, Modal, Field, inputCls, LoadingState, ErrorState } from "../components/ui";

const PAN_INDIA = "PAN-INDIA";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const blank = { name: "", regions: [], customRegion: "", baseRate: "", freeShippingThreshold: "", courierPartner: "", active: true };

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
      regions: zone.regions || [],
      customRegion: "",
      baseRate: String(zone.baseRate ?? ""),
      freeShippingThreshold: String(zone.freeShippingThreshold ?? ""),
      courierPartner: zone.courierPartner || "",
      active: zone.active !== false,
    } : blank);
    setOpen(true);
  }

  function toggleState(state) {
    setForm((f) => ({
      ...f,
      regions: f.regions.includes(state)
        ? f.regions.filter((r) => r !== state)
        : [...f.regions.filter((r) => r !== PAN_INDIA), state],
    }));
  }

  function togglePanIndia() {
    setForm((f) => (f.regions.includes(PAN_INDIA) ? { ...f, regions: [] } : { ...f, regions: [PAN_INDIA] }));
  }

  function addCustomRegion() {
    const value = form.customRegion.trim();
    if (!value || form.regions.includes(value)) return;
    setForm((f) => ({ ...f, regions: [...f.regions.filter((r) => r !== PAN_INDIA), value], customRegion: "" }));
  }

  function removeRegion(region) {
    setForm((f) => ({ ...f, regions: f.regions.filter((r) => r !== region) }));
  }

  async function save(event) {
    event.preventDefault();
    if (!form.regions.length) {
      window.alert("Select at least one state, Pan India, or a custom region.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        regions: form.regions,
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
            { key: "regions", label: "Regions", render: (r) => (r.regions || []).map((v) => (v === PAN_INDIA ? "Pan India" : v)).join(", ") || "—" },
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

          <div className="mb-3.5">
            <span className="block text-xs font-medium text-muted mb-1">Regions</span>

            {form.regions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.regions.map((region) => (
                  <span key={region} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full pl-2.5 pr-1.5 py-1">
                    {region === PAN_INDIA ? "Pan India" : region}
                    <button type="button" onClick={() => removeRegion(region)} className="hover:text-danger"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm mb-2 px-1">
              <input type="checkbox" checked={form.regions.includes(PAN_INDIA)} onChange={togglePanIndia} />
              Ship everywhere (Pan India)
            </label>

            {!form.regions.includes(PAN_INDIA) && (
              <div className="border border-border rounded-md max-h-40 overflow-y-auto scrollbar-thin p-2 grid grid-cols-2 gap-x-2">
                {INDIAN_STATES.map((state) => (
                  <label key={state} className="flex items-center gap-1.5 text-xs py-1 cursor-pointer">
                    <input type="checkbox" checked={form.regions.includes(state)} onChange={() => toggleState(state)} />
                    {state}
                  </label>
                ))}
              </div>
            )}

            {!form.regions.includes(PAN_INDIA) && (
              <div className="flex gap-1.5 mt-2">
                <input
                  className={inputCls}
                  placeholder="Custom region or pincode prefix, e.g. 500"
                  value={form.customRegion}
                  onChange={(e) => setForm({ ...form, customRegion: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomRegion(); } }}
                />
                <Button type="button" variant="secondary" onClick={addCustomRegion}>Add</Button>
              </div>
            )}
          </div>

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
