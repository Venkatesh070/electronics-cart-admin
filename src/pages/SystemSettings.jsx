import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { settingsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { PageHeader, Card, Button, Field, inputCls, LoadingState, ErrorState, Badge } from "../components/ui";
import ImageField from "../components/ImageField";
import { mediaUrl } from "../utils/format";
import { applyBrandIcons } from "../utils/brandIcons";

const blank = {
  storeName: "",
  logo: "",
  tagline: "",
  location: "",
  supportPhone: "",
  whatsapp: "",
  brandAccentColor: "#FF6B1A",
  social: { facebook: "", instagram: "", x: "", youtube: "", linkedin: "" },
  currency: "",
  locale: "",
  timezone: "",
  maintenanceMode: false,
};

export default function SystemSettings() {
  const { data, loading, error, reload } = useAsync(() => settingsApi.get(), []);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.data) setForm({
      storeName: data.data.storeName || "",
      logo: data.data.logo || "",
      tagline: data.data.tagline || "",
      location: data.data.location || "",
      supportPhone: data.data.supportPhone || "",
      whatsapp: data.data.whatsapp || "",
      brandAccentColor: data.data.brandAccentColor || "#FF6B1A",
      social: {
        facebook: data.data.social?.facebook || "",
        instagram: data.data.social?.instagram || "",
        x: data.data.social?.x || "",
        youtube: data.data.social?.youtube || "",
        linkedin: data.data.social?.linkedin || "",
      },
      currency: data.data.currency || "",
      locale: data.data.locale || "",
      timezone: data.data.timezone || "",
      maintenanceMode: Boolean(data.data.maintenanceMode),
      sellerGstin: data.data.sellerGstin || "",
    });
  }, [data]);

  function updateSocial(key, value) {
    setForm((f) => ({ ...f, social: { ...f.social, [key]: value } }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await settingsApi.update(form);
      setSaved(true);
      applyBrandIcons({
        logoUrl: form.logo ? mediaUrl(form.logo) : "",
        fallback: "/favicon.svg",
        appleFallback: "/favicon.svg",
      });
      document.title = `${form.storeName || "Electronics Cart"} — Admin`;
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
                hint="Used in admin, storefront, and the browser tab icon. PNG or SVG recommended (square works best)."
              />
            </div>
            <div className="md:col-span-2">
              <Field label="Tagline" hint="Shown under the store name in the header and footer.">
                <input className={inputCls} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Smart Electronics. Trusted Prices." />
              </Field>
            </div>
            <Field label="Support phone">
              <input className={inputCls} value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} placeholder="040-4856 7878" />
            </Field>
            <Field label="WhatsApp link">
              <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="https://wa.me/914048567878" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Location" hint="Shown in the footer.">
                <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Hyderabad, Telangana, India" />
              </Field>
            </div>
            <Field label="Brand accent color" hint="Colors the second word of the wordmark, e.g. 'CART'.">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded-md border border-border shrink-0 cursor-pointer"
                  value={form.brandAccentColor}
                  onChange={(e) => setForm({ ...form, brandAccentColor: e.target.value })}
                />
                <input
                  className={inputCls}
                  value={form.brandAccentColor}
                  onChange={(e) => setForm({ ...form, brandAccentColor: e.target.value })}
                  placeholder="#FF6B1A"
                />
              </div>
            </Field>
            <Field label="Currency"><input required className={inputCls} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="INR" /></Field>
            <Field label="Locale"><input required className={inputCls} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} placeholder="en-IN" /></Field>
            <div className="md:col-span-2"><Field label="Timezone"><input required className={inputCls} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Asia/Kolkata" /></Field></div>
            <div className="md:col-span-2">
              <Field label="Seller GSTIN">
                <input
                  className={inputCls}
                  value={form.sellerGstin}
                  onChange={(e) => setForm({ ...form, sellerGstin: e.target.value.toUpperCase() })}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </Field>
              <p className="text-xs text-muted -mt-2 mb-3">Required for Shiprocket on orders over ₹50,000 (tax invoice / e-way bill).</p>
            </div>
          </div>

          <div className="mt-2 mb-4">
            <div className="text-sm font-semibold text-ink mb-1">Social links</div>
            <p className="text-xs text-muted mb-3">Leave a field blank to hide that icon in the footer.</p>
            <div className="grid md:grid-cols-2 gap-x-4">
              <Field label="Facebook"><input className={inputCls} value={form.social.facebook} onChange={(e) => updateSocial("facebook", e.target.value)} placeholder="https://facebook.com/yourpage" /></Field>
              <Field label="Instagram"><input className={inputCls} value={form.social.instagram} onChange={(e) => updateSocial("instagram", e.target.value)} placeholder="https://instagram.com/yourpage" /></Field>
              <Field label="X (Twitter)"><input className={inputCls} value={form.social.x} onChange={(e) => updateSocial("x", e.target.value)} placeholder="https://x.com/yourpage" /></Field>
              <Field label="YouTube"><input className={inputCls} value={form.social.youtube} onChange={(e) => updateSocial("youtube", e.target.value)} placeholder="https://youtube.com/@yourpage" /></Field>
              <Field label="LinkedIn"><input className={inputCls} value={form.social.linkedin} onChange={(e) => updateSocial("linkedin", e.target.value)} placeholder="https://linkedin.com/company/yourpage" /></Field>
            </div>
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
