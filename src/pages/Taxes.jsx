import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { taxesApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf, nameOf, titleCase } from "../utils/format";
import { PageHeader, Card, Button, Table, Badge, Modal, Field, inputCls, LoadingState, ErrorState } from "../components/ui";

// Inclusive by default — storefront prices are shown "Inclusive of all taxes", so a new
// rule should not add anything on top of that price unless the admin deliberately chooses to.
const emptyForm = { region: "", ratePercent: "18", category: "", priceMode: "inclusive", active: true };

export default function Taxes() {
  const { data, loading, error, reload } = useAsync(() => taxesApi.list(), []);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
  };

  const openEdit = (rule) => {
    setEditing(rule);
    setForm({
      region: rule.region || "",
      ratePercent: String(rule.ratePercent ?? ""),
      category: idOf(rule.category),
      priceMode: rule.priceMode || "inclusive",
      active: rule.active !== false,
    });
  };

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
        region: form.region.trim(),
        ratePercent: Number(form.ratePercent),
        priceMode: form.priceMode,
        active: form.active,
        ...(form.category.trim() ? { category: form.category.trim() } : {}),
      };
      if (editing) await taxesApi.update(idOf(editing), body);
      else await taxesApi.create(body);
      setEditing(null);
      setForm(emptyForm);
      await reload();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(rule) {
    try {
      await taxesApi.update(idOf(rule), { active: !rule.active });
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function remove(rule) {
    if (!window.confirm(`Delete the tax rule for ${rule.region}?`)) return;
    try {
      await taxesApi.remove(idOf(rule));
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  const rules = data?.data || [];

  return (
    <div>
      <PageHeader eyebrow="Finance" title="Taxes" description="Configure regional tax rates and storefront price treatment." action={<Button onClick={openCreate}><Plus size={14} /> Add tax rule</Button>} />
      {loading ? <LoadingState label="Loading tax rules…" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <Card className="p-4">
          <Table
            rows={rules}
            columns={[
              { key: "region", label: "Region" },
              { key: "category", label: "Category", render: (r) => nameOf(r.category, "All categories") },
              { key: "ratePercent", label: "Rate", render: (r) => `${r.ratePercent}%` },
              { key: "priceMode", label: "Price mode", render: (r) => titleCase(r.priceMode) },
              { key: "active", label: "Status", render: (r) => <button onClick={() => toggle(r)}><Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Active" : "Inactive"}</Badge></button> },
              { key: "actions", label: "", render: (r) => <div className="flex gap-1"><button className="p-1.5 text-muted hover:text-primary" onClick={() => openEdit(r)}><Pencil size={14} /></button><button className="p-1.5 text-muted hover:text-danger" onClick={() => remove(r)}><Trash2 size={14} /></button></div> },
            ]}
          />
        </Card>
      )}
      <Modal open={editing !== null || form !== emptyForm} onClose={() => { setEditing(null); setForm(emptyForm); }} title={editing ? "Edit tax rule" : "Add tax rule"}>
        <form onSubmit={save}>
          <Field label="Region"><input required className={inputCls} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></Field>
          <Field label="Rate (%)"><input required min="0" type="number" step="0.01" className={inputCls} value={form.ratePercent} onChange={(e) => setForm({ ...form, ratePercent: e.target.value })} /></Field>
          <Field label="Category ID (optional)"><input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Price mode">
            <select className={inputCls} value={form.priceMode} onChange={(e) => setForm({ ...form, priceMode: e.target.value })}>
              <option value="inclusive">Tax inclusive (recommended)</option>
              <option value="exclusive">Tax exclusive</option>
            </select>
            <span className="block text-[11px] text-muted mt-1">
              Inclusive: nothing added at checkout beyond the storefront price. Exclusive: this rate is added on top at checkout.
            </span>
          </Field>
          <label className="flex items-center gap-2 text-sm mb-5"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save rule"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
