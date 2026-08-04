import { useState } from "react";
import { Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { bannersApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, idOf, mediaUrl, titleCase } from "../utils/format";
import ImageField from "../components/ImageField";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Modal,
  Field,
  inputCls,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components/ui";

const DEFAULT_FEATURES = [
  "Certified Products",
  "1 Year Warranty",
  "Easy Returns 7 Days",
  "Secure Payments",
];

const EMPTY_FORM = {
  title: "New & Refurbished Laptops You Can Trust.",
  titleHighlight: "Refurbished",
  subtitle: "Certified Quality. 1 Year Warranty.\nBest Prices. Fast Delivery.",
  badge: "CERTIFIED REFURBISHED",
  buttonText: "Shop Now",
  secondaryButtonText: "Explore Refurbished",
  secondaryLinkTarget: "/category/laptops?condition=Refurbished",
  promoText: "Up to 50% OFF on\nRefurbished\nLaptops",
  image: "",
  backgroundImage: "",
  startDate: "",
  endDate: "",
  placement: "home",
  priority: 0,
  active: true,
  linkTarget: "/categories",
  feature1: DEFAULT_FEATURES[0],
  feature2: DEFAULT_FEATURES[1],
  feature3: DEFAULT_FEATURES[2],
  feature4: DEFAULT_FEATURES[3],
};

const BANNER_SIZE = {
  home: {
    product: {
      minWidth: 800,
      minHeight: 600,
      hint: "Product image (laptops): PNG with transparent bg preferred, ~1000×800. Shown on the right.",
    },
    background: {
      minWidth: 1000,
      minHeight: 500,
      hint: "Background image: 1920×800 recommended (min 1000×500). Full-bleed behind the hero.",
    },
  },
  category: {
    product: {
      minWidth: 1200,
      minHeight: 360,
      hint: "Category banner: 1200×400px (min 1200×360).",
    },
    background: {
      minWidth: 1200,
      minHeight: 360,
      hint: "Optional category background: min 1200×360.",
    },
  },
};

function inputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function featuresFrom(banner) {
  const list = Array.isArray(banner?.features) ? banner.features : [];
  return {
    feature1: list[0] || DEFAULT_FEATURES[0],
    feature2: list[1] || DEFAULT_FEATURES[1],
    feature3: list[2] || DEFAULT_FEATURES[2],
    feature4: list[3] || DEFAULT_FEATURES[3],
  };
}

function bannerStatus(banner) {
  if (!banner.active) return "Inactive";
  const now = Date.now();
  const start = new Date(banner.startDate).getTime();
  const end = new Date(banner.endDate).getTime();
  if (start > now) return "Scheduled";
  if (end < now) return "Ended";
  return "Live";
}

function statusTone(status) {
  if (status === "Live") return "success";
  if (status === "Scheduled") return "amber";
  return "neutral";
}

export default function Banners() {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const query = useAsync(() => bannersApi.list(), []);
  const banners = Array.isArray(query.data?.data) ? query.data.data : [];
  const sizeSpec = BANNER_SIZE[form.placement] || BANNER_SIZE.home;

  function openCreate() {
    const today = new Date();
    const end = new Date(today);
    end.setFullYear(end.getFullYear() + 1);
    setForm({
      ...EMPTY_FORM,
      startDate: today.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
    setModal("new");
    setActionError("");
  }

  function openEdit(banner) {
    setForm({
      title: banner.title || "",
      titleHighlight: banner.titleHighlight || "Refurbished",
      subtitle: banner.subtitle || "",
      badge: banner.badge || "",
      buttonText: banner.buttonText || "Shop Now",
      secondaryButtonText: banner.secondaryButtonText || "",
      secondaryLinkTarget: banner.secondaryLinkTarget || "",
      promoText: banner.promoText || "",
      image: banner.image || "",
      backgroundImage: banner.backgroundImage || "",
      startDate: inputDate(banner.startDate),
      endDate: inputDate(banner.endDate),
      placement: banner.placement || "home",
      priority: Number(banner.priority) || 0,
      active: banner.active !== false,
      linkTarget: banner.linkTarget || "",
      ...featuresFrom(banner),
    });
    setModal(banner);
    setActionError("");
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    const features = [form.feature1, form.feature2, form.feature3, form.feature4]
      .map((v) => v.trim())
      .filter(Boolean);
    const payload = {
      title: form.title.trim(),
      titleHighlight: form.titleHighlight.trim(),
      subtitle: form.subtitle.trim(),
      badge: form.badge.trim(),
      buttonText: form.buttonText.trim() || "Shop Now",
      secondaryButtonText: form.secondaryButtonText.trim(),
      secondaryLinkTarget: form.secondaryLinkTarget.trim(),
      promoText: form.promoText.trim(),
      image: form.image.trim(),
      backgroundImage: form.backgroundImage.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      placement: form.placement,
      priority: Number(form.priority),
      active: form.active,
      linkTarget: form.linkTarget.trim() || "/categories",
      features,
    };
    try {
      if (modal === "new") await bannersApi.create(payload);
      else await bannersApi.update(idOf(modal), payload);
      await query.reload();
      setModal(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      setActionError(error?.message || "Could not save the banner.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(banner) {
    if (!window.confirm(`Delete "${banner.title}"?`)) return;
    setSaving(true);
    setActionError("");
    try {
      await bannersApi.remove(idOf(banner));
      await query.reload();
    } catch (error) {
      setActionError(error?.message || "Could not delete the banner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Hero & banners"
        description="Homepage hero matching the storefront design — badge, highlight heading, features, dual CTAs, promo card, and product image."
        action={<Button onClick={openCreate}><Plus size={14} /> Add hero / banner</Button>}
      />
      {actionError && <p className="text-sm text-danger mb-4">{actionError}</p>}

      {query.loading ? (
        <LoadingState label="Loading banners…" />
      ) : query.error ? (
        <ErrorState message={query.error} onRetry={query.reload} />
      ) : banners.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner) => {
            const status = bannerStatus(banner);
            return (
              <Card key={idOf(banner)} className="overflow-hidden">
                <div className="h-36 bg-[#070b16] flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(37,99,235,0.35),transparent_55%),radial-gradient(ellipse_at_90%_70%,rgba(249,115,22,0.2),transparent_45%)]" />
                  {banner.image ? (
                    <img src={mediaUrl(banner.image)} alt={banner.title} className="relative h-full object-contain py-2" />
                  ) : (
                    <div className="relative px-4 text-white text-sm font-semibold line-clamp-2 text-center">{banner.title}</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="font-medium text-ink line-clamp-2">{banner.title}</div>
                    <Badge tone={statusTone(status)}>{status}</Badge>
                  </div>
                  <div className="text-xs text-muted mb-2">
                    {titleCase(banner.placement)} · Priority {banner.priority ?? 0}
                  </div>
                  <div className="text-xs font-mono text-muted mb-3">
                    {formatDate(banner.startDate)} → {formatDate(banner.endDate)}
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(banner)} className="p-1.5 rounded hover:bg-bg text-muted hover:text-ink" aria-label="Edit banner">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(banner)} disabled={saving} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger disabled:opacity-50" aria-label="Delete banner">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={ImageIcon}
            title="No hero section yet"
            description="Create the homepage hero with the mockup layout — dual CTAs, 4 features, promo card, and product image."
            action={<Button onClick={openCreate}><Plus size={14} /> Add hero / banner</Button>}
          />
        </Card>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Add hero / banner" : "Edit hero / banner"} width="max-w-2xl">
        <form onSubmit={save} className="max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Placement">
              <select className={inputCls} value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value })}>
                <option value="home">Home hero</option>
                <option value="category">Category</option>
              </select>
            </Field>
            <Field label="Priority">
              <input type="number" className={inputCls} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} />
            </Field>
          </div>

          <Field label="Badge">
            <input className={inputCls} value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} placeholder="CERTIFIED REFURBISHED" />
          </Field>
          <Field label="Heading">
            <input autoFocus className={inputCls} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Highlight word (orange)">
            <input className={inputCls} value={form.titleHighlight} onChange={(event) => setForm({ ...form, titleHighlight: event.target.value })} placeholder="Refurbished" />
          </Field>
          <Field label="Subtitle (use new line for second row)">
            <textarea className={inputCls} rows={2} value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Feature 1"><input className={inputCls} value={form.feature1} onChange={(e) => setForm({ ...form, feature1: e.target.value })} /></Field>
            <Field label="Feature 2"><input className={inputCls} value={form.feature2} onChange={(e) => setForm({ ...form, feature2: e.target.value })} /></Field>
            <Field label="Feature 3"><input className={inputCls} value={form.feature3} onChange={(e) => setForm({ ...form, feature3: e.target.value })} /></Field>
            <Field label="Feature 4"><input className={inputCls} value={form.feature4} onChange={(e) => setForm({ ...form, feature4: e.target.value })} /></Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Primary button text">
              <input className={inputCls} value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} />
            </Field>
            <Field label="Primary button link">
              <input className={inputCls} value={form.linkTarget} onChange={(e) => setForm({ ...form, linkTarget: e.target.value })} placeholder="/categories" />
            </Field>
            <Field label="Secondary button text">
              <input className={inputCls} value={form.secondaryButtonText} onChange={(e) => setForm({ ...form, secondaryButtonText: e.target.value })} />
            </Field>
            <Field label="Secondary button link">
              <input className={inputCls} value={form.secondaryLinkTarget} onChange={(e) => setForm({ ...form, secondaryLinkTarget: e.target.value })} />
            </Field>
          </div>

          <Field label="Promo card text">
            <input className={inputCls} value={form.promoText} onChange={(e) => setForm({ ...form, promoText: e.target.value })} placeholder="Up to 50% OFF on Refurbished Laptops" />
          </Field>

          <ImageField
            label="Background image"
            folder="misc"
            value={form.backgroundImage}
            onChange={(backgroundImage) => setForm({ ...form, backgroundImage })}
            minWidth={sizeSpec.background.minWidth}
            minHeight={sizeSpec.background.minHeight}
            hint={sizeSpec.background.hint}
          />
          <ImageField
            label="Hero product image"
            folder="misc"
            value={form.image}
            onChange={(image) => setForm({ ...form, image })}
            minWidth={sizeSpec.product.minWidth}
            minHeight={sizeSpec.product.minHeight}
            hint={sizeSpec.product.hint}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Start date">
              <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </Field>
            <Field label="End date">
              <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active on storefront
          </label>

          <div className="flex justify-end gap-2 sticky bottom-0 bg-surface pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.title.trim() || !form.startDate || !form.endDate}>
              {modal === "new" ? "Publish hero" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
