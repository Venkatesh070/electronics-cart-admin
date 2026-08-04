import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { settingsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { PageHeader, Card, Button, Field, inputCls, LoadingState, ErrorState, Badge } from "../components/ui";
import ImageField from "../components/ImageField";

const blank = { storeName: "", logo: "", currency: "", locale: "", timezone: "", maintenanceMode: false };

export default function SystemSettings() {
  const { data, loading, error, reload } = useAsync(() => settingsApi.get(), []);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.data) setForm({
      storeName: data.data.storeName || "",
      logo: data.data.logo || "",
      currency: data.data.currency || "",
      locale: data.data.locale || "",
      timezone: data.data.timezone || "",
      maintenanceMode: Boolean(data.data.maintenanceMode),
    });
  }, [data]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await settingsApi.update(form);
      setSaved(true);
      window.dispatchEvent(new Event("store-settings-changed"));
      await reload();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading system settings…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader eyebrow="Configuration" title="System settings" description="Manage global storefront defaults and maintenance access." action={saved && <Badge tone="success">Settings saved</Badge>} />
      <form onSubmit={save}>
        <Card className="p-5 max-w-2xl">
          <div className="grid md:grid-cols-2 gap-x-4">
            <div className="md:col-span-2"><Field label="Store name"><input required className={inputCls} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></Field></div>
            <div className="md:col-span-2">
              <ImageField
                label="Store logo"
                folder="misc"
                value={form.logo}
                onChange={(logo) => setForm({ ...form, logo })}
                hint="Shown in admin and storefront. PNG or SVG recommended."
              />
            </div>
            <Field label="Currency"><input required className={inputCls} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="INR" /></Field>
            <Field label="Locale"><input required className={inputCls} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} placeholder="en-IN" /></Field>
            <div className="md:col-span-2"><Field label="Timezone"><input required className={inputCls} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Asia/Kolkata" /></Field></div>
          </div>
          <label className="flex items-center justify-between border border-border rounded-md p-4 my-2">
            <div><span className="block text-sm font-medium text-ink">Maintenance mode</span><span className="text-xs text-muted">Temporarily prevent customers from accessing the storefront.</span></div>
            <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })} />
          </label>
          <div className="flex justify-end mt-5"><Button type="submit" disabled={saving}><Save size={14} /> {saving ? "Saving…" : "Save settings"}</Button></div>
        </Card>
      </form>
    </div>
  );
}
