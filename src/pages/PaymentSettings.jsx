import { useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { paymentSettingsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { titleCase } from "../utils/format";
import { PageHeader, Card, Button, Badge, Modal, Field, inputCls, LoadingState, ErrorState } from "../components/ui";

const blank = { provider: "", enabled: false, settlementAccount: "", credentials: [{ key: "keyId", value: "" }, { key: "keySecret", value: "" }] };

export default function PaymentSettings() {
  const { data, loading, error, reload } = useAsync(() => paymentSettingsApi.list(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  function configure(gateway) {
    setForm(gateway ? {
      provider: gateway.provider,
      enabled: gateway.enabled,
      settlementAccount: gateway.settlementAccount || "",
      credentials: [{ key: "keyId", value: "" }, { key: "keySecret", value: "" }],
    } : blank);
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const credentials = Object.fromEntries(form.credentials.filter((item) => item.key.trim() && item.value).map((item) => [item.key.trim(), item.value]));
      await paymentSettingsApi.upsert({
        provider: form.provider.trim(),
        enabled: form.enabled,
        settlementAccount: form.settlementAccount.trim() || undefined,
        ...(Object.keys(credentials).length ? { credentials } : {}),
      });
      setOpen(false);
      await reload();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(gateway) {
    try {
      await paymentSettingsApi.upsert({ provider: gateway.provider, enabled: !gateway.enabled, settlementAccount: gateway.settlementAccount });
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  function updateCredential(index, field, value) {
    setForm({ ...form, credentials: form.credentials.map((item, i) => i === index ? { ...item, [field]: value } : item) });
  }

  return (
    <div>
      <PageHeader eyebrow="Finance" title="Payment settings" description="Configure gateways without exposing stored credentials." action={<Button onClick={() => configure()}><Plus size={14} /> Add gateway</Button>} />
      {loading ? <LoadingState label="Loading payment gateways…" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data?.data || []).map((gateway) => (
            <Card key={gateway.provider} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div><h3 className="font-display font-semibold text-ink">{titleCase(gateway.provider)}</h3><p className="text-xs text-muted mt-1">{gateway.settlementAccount || "No settlement account"}</p></div>
                <button onClick={() => toggle(gateway)}><Badge tone={gateway.enabled ? "success" : "neutral"}>{gateway.enabled ? "Enabled" : "Disabled"}</Badge></button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted mb-4"><KeyRound size={14} /><span>{gateway.credentialsSet ? "Credentials configured" : "Credentials not configured"}</span></div>
              <Button variant="secondary" size="sm" onClick={() => configure(gateway)}>Configure</Button>
            </Card>
          ))}
          {(data?.data || []).length === 0 && <Card className="p-8 text-center text-sm text-muted md:col-span-2 xl:col-span-3">No payment gateways configured.</Card>}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Configure payment gateway">
        <form onSubmit={save}>
          <Field label="Provider"><input required disabled={(data?.data || []).some((g) => g.provider === form.provider)} className={inputCls} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g. razorpay" /></Field>
          <Field label="Settlement account"><input className={inputCls} value={form.settlementAccount} onChange={(e) => setForm({ ...form, settlementAccount: e.target.value })} /></Field>
          <div className="text-xs font-medium text-muted mb-2">Credentials (leave values blank to keep existing credentials)</div>
          {form.credentials.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
              <input aria-label="Credential key" className={inputCls} value={item.key} onChange={(e) => updateCredential(index, "key", e.target.value)} />
              <input aria-label="Credential value" type="password" className={inputCls} value={item.value} onChange={(e) => updateCredential(index, "value", e.target.value)} />
              <button type="button" className="text-muted hover:text-danger px-1" onClick={() => setForm({ ...form, credentials: form.credentials.filter((_, i) => i !== index) })}><Trash2 size={15} /></button>
            </div>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, credentials: [...form.credentials, { key: "", value: "" }] })}><Plus size={13} /> Add field</Button>
          <label className="flex items-center gap-2 text-sm my-5"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enable gateway</label>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save gateway"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
