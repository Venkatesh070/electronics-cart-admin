import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Lightbulb, Loader2, Plus, Search, Trash2, Upload, X, Zap } from "lucide-react";
import { categoriesApi, flashSalesApi, productsApi, uploadsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf, mediaUrl, nameOf } from "../utils/format";
import { Badge, Button, Card, ErrorState, inputCls, LoadingState, Modal } from "../components/ui";
import clsx from "clsx";

const SHORT_MAX = 160;
const TIPS = [
  "Flash sales create urgency — keep the duration short.",
  "Highlight the biggest discount in the sale title.",
  "Promote flash sales via email and push notifications.",
  "Limit stock to increase conversion and FOMO.",
];

const BG_PRESETS = [
  {
    id: "ember",
    label: "Ember",
    from: "#0c0e14",
    to: "#4a1f1a",
    css: "linear-gradient(105deg, #0c0e14 0%, #2a1818 48%, #4a1f1a 100%)",
  },
  {
    id: "midnight",
    label: "Midnight",
    from: "#0b1220",
    to: "#1e3a5f",
    css: "linear-gradient(105deg, #0b1220 0%, #152238 48%, #1e3a5f 100%)",
  },
  {
    id: "violet",
    label: "Violet",
    from: "#12081f",
    to: "#4c1d95",
    css: "linear-gradient(105deg, #12081f 0%, #2e1065 48%, #4c1d95 100%)",
  },
  {
    id: "forest",
    label: "Forest",
    from: "#07140f",
    to: "#14532d",
    css: "linear-gradient(105deg, #07140f 0%, #0f2922 48%, #14532d 100%)",
  },
];

function FormField({ children, className }) {
  return <div className={clsx("mb-3.5", className)}>{children}</div>;
}

function Label({ children, required }) {
  return (
    <span className="block text-xs font-semibold text-ink mb-1.5">
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </span>
  );
}

function SectionCard({ number, title, children, className }) {
  return (
    <Card className={clsx("p-5", className)}>
      <div className="flex items-center gap-2.5 mb-4">
        {number != null && (
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {number}
          </span>
        )}
        <h2 className="font-display font-semibold text-ink text-[15px]">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function primaryImage(images = []) {
  if (!Array.isArray(images) || !images.length) return "";
  const primary = images.find((img) => img?.isPrimary) || images[0];
  return typeof primary === "string" ? primary : primary?.url || "";
}

function toLocalParts(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function fromLocalParts(date, time) {
  if (!date) return "";
  const t = time || "00:00";
  const d = new Date(`${date}T${t}`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function formatDuration(startsAt, endsAt) {
  if (!startsAt || !endsAt) return "—";
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (ms <= 0) return "Invalid range";
  const totalMins = Math.floor(ms / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;
  const parts = [];
  if (days) parts.push(`${days} Day${days === 1 ? "" : "s"}`);
  if (hours || days) parts.push(`${hours} Hour${hours === 1 ? "" : "s"}`);
  parts.push(`${mins} Minute${mins === 1 ? "" : "s"}`);
  return parts.join(" ");
}

function formatPeriod(startsAt, endsAt) {
  if (!startsAt || !endsAt) return "—";
  const opts = { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" };
  return `${new Date(startsAt).toLocaleString("en-IN", opts)} – ${new Date(endsAt).toLocaleString("en-IN", opts)}`;
}

function blankForm() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000 - 60 * 1000);
  const sp = toLocalParts(start.toISOString());
  const ep = toLocalParts(end.toISOString());
  return {
    name: "",
    saleType: "sitewide",
    shortDescription: "",
    startDate: sp.date,
    startTime: sp.time,
    endDate: ep.date,
    endTime: ep.time,
    timezone: "Asia/Kolkata",
    discountType: "percentage",
    discountValue: "20",
    maxDiscount: "",
    minPurchase: "",
    applicableOn: "all",
    selectionMode: "all",
    products: [],
    categories: [],
    status: "DRAFT",
    bgMode: "preset",
    bgPreset: "ember",
    bgColorFrom: "#0c0e14",
    bgColorTo: "#4a1f1a",
    bgImage: "",
  };
}

function resolvePreviewBackground(form) {
  if (form.bgMode === "image" && form.bgImage) {
    return {
      backgroundImage: `linear-gradient(105deg, rgba(12,14,20,0.88) 0%, rgba(12,14,20,0.45) 45%, rgba(40,18,16,0.55) 100%), url(${mediaUrl(form.bgImage)})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (form.bgMode === "gradient") {
    return {
      background: `linear-gradient(105deg, ${form.bgColorFrom || "#0c0e14"} 0%, ${form.bgColorTo || "#4a1f1a"} 100%)`,
    };
  }
  if (form.bgMode === "auto") {
    return {
      background: "linear-gradient(105deg, #0c0e14 0%, #1c2438 48%, #3a2418 100%)",
    };
  }
  const preset = BG_PRESETS.find((p) => p.id === form.bgPreset) || BG_PRESETS[0];
  return { background: preset.css };
}

export default function FlashSaleForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(null);
  const [pickerQ, setPickerQ] = useState("");
  const [uploadingBg, setUploadingBg] = useState(false);
  const bgInputRef = useRef(null);

  const meta = useAsync(async () => {
    const [products, categories] = await Promise.all([
      productsApi.list({ status: "all", limit: 200 }),
      categoriesApi.list(),
    ]);
    return { products: products.data || [], categories: categories.data || [] };
  }, []);

  const existing = useAsync(
    async () => {
      if (!id) return null;
      const res = await flashSalesApi.get(id);
      return res.data;
    },
    [id]
  );

  useEffect(() => {
    if (!existing.data) return;
    const s = existing.data;
    const sp = toLocalParts(s.startsAt);
    const ep = toLocalParts(s.endsAt);
    const products = (s.products || []).map((row) => {
      const p = row.product && typeof row.product === "object" ? row.product : null;
      return {
        id: idOf(p) || String(row.product || ""),
        name: nameOf(p, "Product"),
        image: primaryImage(p?.images),
        discountPercent: String(row.discountPercent ?? s.discountValue ?? 20),
        stockCap: String(row.stockCap ?? 0),
        items: 1,
      };
    });
    const categories = (s.categories || []).map((row) => {
      const c = row.category && typeof row.category === "object" ? row.category : null;
      return {
        id: idOf(c) || String(row.category || ""),
        name: nameOf(c, "Category"),
        image: c?.image || "",
        discountPercent: String(row.discountPercent ?? s.discountValue ?? 20),
        items: c?.productCount || 0,
      };
    });
    setForm({
      name: s.name || "",
      saleType: s.saleType || "sitewide",
      shortDescription: s.shortDescription || "",
      startDate: sp.date,
      startTime: sp.time,
      endDate: ep.date,
      endTime: ep.time,
      timezone: s.timezone || "Asia/Kolkata",
      discountType: s.discountType || "percentage",
      discountValue: String(s.discountValue ?? 20),
      maxDiscount: s.maxDiscount != null ? String(s.maxDiscount) : "",
      minPurchase: s.minPurchase != null ? String(s.minPurchase) : "",
      applicableOn: s.applicableOn || (products.length || categories.length ? "selected" : "all"),
      selectionMode: s.applicableOn === "selected" || products.length || categories.length ? "selected" : "all",
      products,
      categories,
      status: s.status || (s.active === false ? "INACTIVE" : "ACTIVE"),
      bgMode: s.bannerBackground?.mode || "preset",
      bgPreset: s.bannerBackground?.preset || "ember",
      bgColorFrom: s.bannerBackground?.colorFrom || "#0c0e14",
      bgColorTo: s.bannerBackground?.colorTo || "#4a1f1a",
      bgImage: s.bannerBackground?.image || "",
    });
  }, [existing.data]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const startsAt = fromLocalParts(form.startDate, form.startTime);
  const endsAt = fromLocalParts(form.endDate, form.endTime);
  const durationLabel = formatDuration(startsAt, endsAt);
  const discountLabel =
    form.discountType === "fixed" ? `₹${form.discountValue || 0}` : `${form.discountValue || 0}%`;

  const selectedRows = useMemo(() => {
    const productRows = form.products.map((p) => ({ ...p, type: "product" }));
    const categoryRows = form.categories.map((c) => ({ ...c, type: "category" }));
    return [...productRows, ...categoryRows];
  }, [form.products, form.categories]);

  const totalProducts = useMemo(() => {
    if (form.selectionMode === "all") return meta.data?.products?.length || 0;
    const fromProducts = form.products.length;
    const fromCats = form.categories.reduce((sum, c) => sum + (Number(c.items) || 0), 0);
    return fromProducts + fromCats;
  }, [form.selectionMode, form.products, form.categories, meta.data]);

  const pickerItems = useMemo(() => {
    if (!picker || !meta.data) return [];
    const q = pickerQ.trim().toLowerCase();
    if (picker === "products") {
      return (meta.data.products || []).filter((p) => {
        if (form.products.some((x) => x.id === idOf(p))) return false;
        if (!q) return true;
        return [p.name, p.sku, p.slug].some((v) => String(v || "").toLowerCase().includes(q));
      });
    }
    return (meta.data.categories || []).filter((c) => {
      if (form.categories.some((x) => x.id === idOf(c))) return false;
      if (!q) return true;
      return String(c.name || "")
        .toLowerCase()
        .includes(q);
    });
  }, [picker, pickerQ, meta.data, form.products, form.categories]);

  function addProduct(p) {
    setForm((f) => ({
      ...f,
      products: [
        ...f.products,
        {
          id: idOf(p),
          name: p.name,
          image: primaryImage(p.images),
          discountPercent: f.discountValue || "20",
          stockCap: String(p.stock ?? 10),
          items: 1,
        },
      ],
      selectionMode: "selected",
      applicableOn: "selected",
    }));
  }

  function addCategory(c) {
    setForm((f) => ({
      ...f,
      categories: [
        ...f.categories,
        {
          id: idOf(c),
          name: c.name,
          image: c.image || "",
          discountPercent: f.discountValue || "20",
          items: c.productCount || 0,
        },
      ],
      selectionMode: "selected",
      applicableOn: "selected",
    }));
  }

  function removeRow(type, rowId) {
    setForm((f) =>
      type === "product"
        ? { ...f, products: f.products.filter((p) => p.id !== rowId) }
        : { ...f, categories: f.categories.filter((c) => c.id !== rowId) }
    );
  }

  function updateRowDiscount(type, rowId, value) {
    setForm((f) => {
      if (type === "product") {
        return {
          ...f,
          products: f.products.map((p) => (p.id === rowId ? { ...p, discountPercent: value } : p)),
        };
      }
      return {
        ...f,
        categories: f.categories.map((c) => (c.id === rowId ? { ...c, discountPercent: value } : c)),
      };
    });
  }

  function buildBody(statusOverride) {
    const status = statusOverride || form.status;
    const discountValue = Number(form.discountValue) || 0;
    return {
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      saleType: form.saleType,
      startsAt,
      endsAt,
      timezone: form.timezone,
      discountType: form.discountType,
      discountValue,
      maxDiscount: form.maxDiscount === "" ? undefined : Number(form.maxDiscount),
      minPurchase: form.minPurchase === "" ? undefined : Number(form.minPurchase),
      applicableOn: form.selectionMode === "all" ? "all" : "selected",
      status,
      active: status === "ACTIVE",
      bannerBackground: {
        mode: form.bgMode,
        preset: form.bgPreset,
        colorFrom: form.bgColorFrom,
        colorTo: form.bgColorTo,
        image: form.bgImage || undefined,
      },
      products:
        form.selectionMode === "all"
          ? []
          : form.products.map((p) => ({
              product: p.id,
              discountPercent: Number(p.discountPercent) || discountValue,
              stockCap: Number(p.stockCap) || 0,
            })),
      categories:
        form.selectionMode === "all"
          ? []
          : form.categories.map((c) => ({
              category: c.id,
              discountPercent: Number(c.discountPercent) || discountValue,
            })),
    };
  }

  async function uploadBackground(fileList) {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB allowed");
      return;
    }
    setUploadingBg(true);
    try {
      const res = await uploadsApi.image(file, "flash-sales");
      setForm((f) => ({ ...f, bgMode: "image", bgImage: res.data.url }));
    } catch (e) {
      alert(e?.message || "Upload failed");
    } finally {
      setUploadingBg(false);
      if (bgInputRef.current) bgInputRef.current.value = "";
    }
  }

  async function save(statusOverride) {
    if (!form.name.trim()) {
      alert("Sale title is required");
      return;
    }
    if (!startsAt || !endsAt) {
      alert("Start and end date/time are required");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      alert("End must be after start");
      return;
    }
    if (
      form.selectionMode === "selected" &&
      !form.products.length &&
      !form.categories.length &&
      statusOverride !== "DRAFT" &&
      form.status !== "DRAFT"
    ) {
      alert("Add at least one product or category, or choose All Products");
      return;
    }
    setSaving(true);
    try {
      const body = buildBody(statusOverride);
      if (isEdit) await flashSalesApi.update(id, body);
      else await flashSalesApi.create(body);
      navigate("/flash-sales");
    } catch (e) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if ((meta.loading && !meta.data) || (isEdit && existing.loading && !existing.data)) {
    return <LoadingState label={isEdit ? "Loading flash sale…" : "Loading form…"} />;
  }
  if (meta.error && !meta.data) return <ErrorState message={meta.error} onRetry={meta.reload} />;
  if (isEdit && existing.error && !existing.data) {
    return <ErrorState message={existing.error} onRetry={existing.reload} />;
  }

  const statusBadge =
    form.status === "ACTIVE" ? "success" : form.status === "DRAFT" ? "amber" : "neutral";

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <nav className="text-xs text-muted mb-1.5 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-primary">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-muted">Marketing</span>
            <span>/</span>
            <Link to="/flash-sales" className="hover:text-primary">
              Flash Sales
            </Link>
            <span>/</span>
            <span className="text-ink">{isEdit ? "Edit Flash Sale" : "Create Flash Sale"}</span>
          </nav>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {isEdit ? "Edit Flash Sale" : "Create Flash Sale"}
          </h1>
          <p className="text-sm text-muted mt-1">Create a limited-time flash sale to boost your sales.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/flash-sales")} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" type="button" onClick={() => save("DRAFT")} disabled={saving}>
            Save as Draft
          </Button>
          <Button type="button" onClick={() => save("ACTIVE")} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Flash Sale" : "Create Flash Sale"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 flex flex-col gap-4">
          <SectionCard number={1} title="Basic Information">
            <FormField>
              <Label required>Sale Title</Label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Weekend Mega Flash Sale"
              />
            </FormField>
            <FormField>
              <Label required>Sale Type</Label>
              <div className="flex flex-wrap gap-5 text-sm">
                {[
                  { value: "sitewide", label: "Sitewide" },
                  { value: "product_specific", label: "Product Specific" },
                ].map((opt) => (
                  <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="saleType"
                      checked={form.saleType === opt.value}
                      onChange={() => {
                        set("saleType", opt.value);
                        if (opt.value === "product_specific") {
                          setForm((f) => ({
                            ...f,
                            saleType: opt.value,
                            selectionMode: "selected",
                            applicableOn: "selected",
                          }));
                        }
                      }}
                      className="text-primary focus:ring-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </FormField>
            <FormField className="mb-0">
              <div className="flex items-center justify-between">
                <Label required>Short Description</Label>
                <span className="text-[11px] text-muted">
                  {form.shortDescription.length}/{SHORT_MAX}
                </span>
              </div>
              <textarea
                className={inputCls}
                rows={2}
                maxLength={SHORT_MAX}
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                placeholder="Brief description of this flash sale"
              />
            </FormField>
          </SectionCard>

          <SectionCard number={2} title="Schedule">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <Label required>Start Date</Label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </FormField>
              <FormField>
                <Label required>Start Time</Label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                />
              </FormField>
              <FormField>
                <Label required>End Date</Label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </FormField>
              <FormField>
                <Label required>End Time</Label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <Label>Timezone</Label>
                <select className={inputCls} value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
                  <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>
                  <option value="UTC">(GMT+00:00) UTC</option>
                  <option value="Asia/Dubai">(GMT+04:00) Asia/Dubai</option>
                  <option value="America/New_York">(GMT-05:00) America/New_York</option>
                </select>
              </FormField>
              <FormField>
                <Label>Duration</Label>
                <input className={inputCls} value={durationLabel} readOnly />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard number={3} title="Discount Settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <Label required>Discount Type</Label>
                <select
                  className={inputCls}
                  value={form.discountType}
                  onChange={(e) => set("discountType", e.target.value)}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </FormField>
              <FormField>
                <Label required>Discount Value</Label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={form.discountType === "percentage" ? 100 : undefined}
                    className={clsx(inputCls, "pr-10")}
                    value={form.discountValue}
                    onChange={(e) => set("discountValue", e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                    {form.discountType === "percentage" ? "%" : "₹"}
                  </span>
                </div>
              </FormField>
              <FormField>
                <Label>Maximum Discount (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                  <input
                    type="number"
                    min="0"
                    className={clsx(inputCls, "pl-7")}
                    value={form.maxDiscount}
                    onChange={(e) => set("maxDiscount", e.target.value)}
                    placeholder="No limit"
                  />
                </div>
              </FormField>
              <FormField>
                <Label>Min. Purchase Amount (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                  <input
                    type="number"
                    min="0"
                    className={clsx(inputCls, "pl-7")}
                    value={form.minPurchase}
                    onChange={(e) => set("minPurchase", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </FormField>
              <FormField className="sm:col-span-2">
                <Label>Applicable on</Label>
                <select
                  className={inputCls}
                  value={form.applicableOn}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((f) => ({
                      ...f,
                      applicableOn: value,
                      selectionMode: value === "all" ? "all" : "selected",
                    }));
                  }}
                >
                  <option value="all">All Products</option>
                  <option value="selected">Selected Products / Categories</option>
                </select>
              </FormField>
            </div>
          </SectionCard>

          <SectionCard number={4} title="Products & Categories">
            <FormField>
              <Label>Choose Products</Label>
              <div className="flex flex-wrap gap-5 text-sm mb-3">
                {[
                  { value: "all", label: "All Products" },
                  { value: "selected", label: "Select Products / Categories" },
                ].map((opt) => (
                  <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="selectionMode"
                      checked={form.selectionMode === opt.value}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          selectionMode: opt.value,
                          applicableOn: opt.value === "all" ? "all" : "selected",
                        }))
                      }
                      className="text-primary focus:ring-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </FormField>

            {form.selectionMode === "selected" && (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setPicker("products");
                      setPickerQ("");
                    }}
                  >
                    <Plus size={14} /> Add Products
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setPicker("categories");
                      setPickerQ("");
                    }}
                  >
                    <Plus size={14} /> Add Categories
                  </Button>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-3 py-2.5 bg-bg/80 border-b border-border text-xs font-semibold text-muted">
                    Selected Products / Categories ({selectedRows.length})
                  </div>
                  {selectedRows.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted">
                      No items selected yet. Add products or categories.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase">Type</th>
                            <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase">Name</th>
                            <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase">Items</th>
                            <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase">Discount</th>
                            <th className="px-3 py-2.5 w-10" />
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRows.map((row) => (
                            <tr key={`${row.type}-${row.id}`} className="border-b border-border last:border-0">
                              <td className="px-3 py-2.5">
                                <Badge tone={row.type === "product" ? "success" : "primary"}>
                                  {row.type === "product" ? "Product" : "Category"}
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  {row.image ? (
                                    <img
                                      src={mediaUrl(row.image)}
                                      alt=""
                                      className="w-8 h-8 rounded object-cover bg-bg border border-border"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-bg border border-border" />
                                  )}
                                  <span className="font-medium text-ink">{row.name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-muted">
                                {row.type === "category" ? `${row.items || 0} Products` : "1"}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="relative w-20">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className={clsx(inputCls, "pr-7 py-1.5")}
                                    value={row.discountPercent}
                                    onChange={(e) => updateRowDiscount(row.type, row.id, e.target.value)}
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">
                                    %
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <button
                                  type="button"
                                  onClick={() => removeRow(row.type, row.id)}
                                  className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger-light"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </SectionCard>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4">
          <SectionCard number={5} title="Banner Background">
            <FormField>
              <Label>Background type</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "auto", label: "Auto (product)" },
                  { value: "preset", label: "Preset" },
                  { value: "gradient", label: "Custom gradient" },
                  { value: "image", label: "Image" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("bgMode", opt.value)}
                    className={clsx(
                      "text-xs font-medium px-2.5 py-2 rounded-md border text-left transition-colors",
                      form.bgMode === opt.value
                        ? "border-primary bg-primary-light text-primary-dark"
                        : "border-border text-ink hover:bg-bg"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-1.5">
                {form.bgMode === "auto"
                  ? "Storefront picks colors from the featured product image."
                  : "Shown on the landing page flash sale banner."}
              </p>
            </FormField>

            {form.bgMode === "preset" && (
              <FormField>
                <Label>Preset</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BG_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => set("bgPreset", p.id)}
                      className={clsx(
                        "rounded-lg overflow-hidden border-2 text-left transition-all",
                        form.bgPreset === p.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                      )}
                    >
                      <div className="h-12" style={{ background: p.css }} />
                      <div className="px-2 py-1.5 text-[11px] font-medium text-ink bg-white">{p.label}</div>
                    </button>
                  ))}
                </div>
              </FormField>
            )}

            {form.bgMode === "gradient" && (
              <div className="grid grid-cols-2 gap-3">
                <FormField>
                  <Label>From</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.bgColorFrom}
                      onChange={(e) => set("bgColorFrom", e.target.value)}
                      className="w-10 h-10 rounded border border-border cursor-pointer bg-white"
                    />
                    <input
                      className={inputCls}
                      value={form.bgColorFrom}
                      onChange={(e) => set("bgColorFrom", e.target.value)}
                    />
                  </div>
                </FormField>
                <FormField>
                  <Label>To</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.bgColorTo}
                      onChange={(e) => set("bgColorTo", e.target.value)}
                      className="w-10 h-10 rounded border border-border cursor-pointer bg-white"
                    />
                    <input
                      className={inputCls}
                      value={form.bgColorTo}
                      onChange={(e) => set("bgColorTo", e.target.value)}
                    />
                  </div>
                </FormField>
              </div>
            )}

            {form.bgMode === "image" && (
              <FormField>
                <Label>Background image</Label>
                {form.bgImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-border h-28">
                    <img src={mediaUrl(form.bgImage)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set("bgImage", "")}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    disabled={uploadingBg}
                    className="w-full border-2 border-dashed border-border rounded-lg py-6 text-center hover:border-primary/40"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-light text-primary mx-auto mb-2 flex items-center justify-center">
                      {uploadingBg ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    </div>
                    <div className="text-sm font-medium text-ink">Upload background</div>
                    <div className="text-[11px] text-muted mt-1">JPG, PNG, WEBP · Max 5MB</div>
                  </button>
                )}
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadBackground(e.target.files)}
                />
                {form.bgImage && (
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    className="mt-2"
                    onClick={() => bgInputRef.current?.click()}
                    disabled={uploadingBg}
                  >
                    Replace image
                  </Button>
                )}
              </FormField>
            )}
          </SectionCard>

          <SectionCard title="Sale Preview">
            <div
              className="rounded-xl overflow-hidden text-white p-5 mb-4 relative min-h-[148px]"
              style={resolvePreviewBackground(form)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/10 pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                  <Zap size={11} /> FLASH SALE
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-300 mb-1 truncate">
                  {form.name.trim() || "Weekend Mega Flash Sale"}
                </div>
                <div className="font-display text-2xl font-bold mb-1 leading-tight">
                  {form.discountType === "fixed"
                    ? `₹${form.discountValue || 0} OFF`
                    : `UP TO ${form.discountValue || 0}% OFF`}
                </div>
                <div className="text-xs font-medium text-white/85">LIMITED TIME ONLY!</div>
                {form.products[0]?.image && (
                  <div className="absolute right-3 bottom-3 w-14 h-14 rounded-lg bg-white/95 p-1 shadow hidden sm:block">
                    <img
                      src={mediaUrl(form.products[0].image)}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted mb-3">Live preview of the storefront banner background.</p>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-[11px] text-muted uppercase tracking-wide">Title</div>
                <div className="font-medium text-ink">{form.name.trim() || "Weekend Mega Flash Sale"}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted uppercase tracking-wide">Duration</div>
                <div className="text-ink">{durationLabel}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted uppercase tracking-wide">Sale Period</div>
                <div className="text-ink text-xs leading-relaxed">{formatPeriod(startsAt, endsAt)}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Sale Summary">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Sale Type", form.saleType === "sitewide" ? "Sitewide" : "Product Specific"],
                ["Discount", discountLabel],
                ["Min. Purchase", form.minPurchase ? `₹${form.minPurchase}` : "—"],
                ["Maximum Discount", form.maxDiscount ? `₹${form.maxDiscount}` : "—"],
                [
                  "Applicable On",
                  form.selectionMode === "all" ? "All Products" : "Selected Products / Categories",
                ],
                [
                  "Products Included",
                  form.selectionMode === "all" ? "All" : String(selectedRows.length),
                ],
                ["Total Products", String(totalProducts)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-ink text-right">{value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <dt className="text-muted">Status</dt>
                <dd>
                  <Badge tone={statusBadge}>{form.status}</Badge>
                </dd>
              </div>
            </dl>
            <div className="mt-3 pt-3 border-t border-border">
              <Label>Set Status</Label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </SectionCard>

          <Card className="p-5 bg-primary-light/40 border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-primary" />
              <h2 className="font-display font-semibold text-ink text-[15px]">Tips</h2>
            </div>
            <ul className="space-y-2.5">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-muted">
                  <Check size={14} className="text-success mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Modal
        open={!!picker}
        onClose={() => setPicker(null)}
        title={picker === "products" ? "Add Products" : "Add Categories"}
        width="max-w-lg"
      >
        <div className="relative mb-3">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className={clsx(inputCls, "pl-8")}
            value={pickerQ}
            onChange={(e) => setPickerQ(e.target.value)}
            placeholder={picker === "products" ? "Search products…" : "Search categories…"}
            autoFocus
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto space-y-1">
          {!pickerItems.length && <p className="text-sm text-muted text-center py-8">No items found.</p>}
          {pickerItems.map((item) => (
            <button
              key={idOf(item)}
              type="button"
              onClick={() => {
                if (picker === "products") addProduct(item);
                else addCategory(item);
              }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-bg text-left"
            >
              {picker === "products" ? (
                primaryImage(item.images) ? (
                  <img
                    src={mediaUrl(primaryImage(item.images))}
                    alt=""
                    className="w-9 h-9 rounded object-cover bg-bg border border-border"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-bg border border-border" />
                )
              ) : item.image ? (
                <img
                  src={mediaUrl(item.image)}
                  alt=""
                  className="w-9 h-9 rounded object-cover bg-bg border border-border"
                />
              ) : (
                <div className="w-9 h-9 rounded bg-primary-light text-primary flex items-center justify-center text-xs font-semibold">
                  {String(item.name || "").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{item.name}</div>
                <div className="text-[11px] text-muted">
                  {picker === "products"
                    ? item.sku || "Product"
                    : `${item.productCount || 0} products`}
                </div>
              </div>
              <Plus size={14} className="text-primary shrink-0" />
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-3 mt-3 border-t border-border">
          <Button variant="secondary" type="button" onClick={() => setPicker(null)}>
            <X size={14} /> Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
