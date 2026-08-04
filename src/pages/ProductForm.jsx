import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Trash2,
  Underline,
  Upload,
  X,
} from "lucide-react";
import { brandsApi, categoriesApi, productsApi, uploadsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf, mediaUrl } from "../utils/format";
import { Button, Card, ErrorState, inputCls, LoadingState, Modal } from "../components/ui";
import clsx from "clsx";

function FormField({ children, className }) {
  return <div className={clsx("mb-3.5", className)}>{children}</div>;
}

const MAX_IMAGES = 10;
const SHORT_DESC_MAX = 160;
const DESC_MAX = 5000;

const COLOR_HEX = {
  silver: "#C0C4CC",
  "space black": "#1C1C1E",
  starlight: "#F5F0E8",
  black: "#111111",
  white: "#F5F5F5",
  gold: "#D4AF37",
  blue: "#2563EB",
  red: "#DC2626",
  green: "#16A34A",
  gray: "#9CA3AF",
  grey: "#9CA3AF",
};

const DEFAULT_ATTRIBUTES = [
  { name: "Color", values: ["Silver", "Space Black", "Starlight"] },
  { name: "RAM", values: ["8GB", "16GB", "24GB"] },
  { name: "Storage", values: ["256GB SSD", "512GB SSD", "1TB SSD"] },
];

const blankForm = () => ({
  name: "",
  slug: "",
  brandId: "",
  categoryId: "",
  subCategoryId: "",
  shortDescription: "",
  description: "",
  images: [],
  attributes: DEFAULT_ATTRIBUTES.map((a) => ({ ...a, values: [...a.values] })),
  variants: [],
  tax: "18",
  hsn: "",
  trackInventory: true,
  allowBackorders: false,
  minOrderQty: "1",
  maxOrderQty: "",
  minStock: "5",
  unit: "Pcs",
  soldIndividually: false,
  status: "ACTIVE",
  visibility: "catalog_search",
  featured: false,
  warranty: "1 Year",
  returnPolicy: "7",
  condition: "new",
  countryOfOrigin: "India",
  tags: [],
  sku: "",
  price: "",
  stock: "0",
});

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function colorHex(name) {
  return COLOR_HEX[String(name || "").toLowerCase()] || "#94A3B8";
}

function abbr(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 6)
    .toUpperCase();
}

function cartesian(attrs) {
  if (!attrs.length) return [];
  return attrs.reduce(
    (acc, attr) => {
      const values = (attr.values || []).filter(Boolean);
      if (!values.length) return acc;
      if (!acc.length) return values.map((v) => ({ [attr.name]: v }));
      return acc.flatMap((row) => values.map((v) => ({ ...row, [attr.name]: v })));
    },
    []
  );
}

function SectionCard({ number, title, action, children, className }) {
  return (
    <Card className={clsx("p-5", className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {number}
          </span>
          <h2 className="font-display font-semibold text-ink text-[15px]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Label({ children, required }) {
  return (
    <span className="block text-xs font-semibold text-ink mb-1.5">
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </span>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative w-10 h-5 rounded-full transition-colors shrink-0",
        checked ? "bg-primary" : "bg-gray-300"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

function RichTextToolbar({ onFormat }) {
  const tools = [
    { icon: Bold, cmd: "bold" },
    { icon: Italic, cmd: "italic" },
    { icon: Underline, cmd: "underline" },
    { icon: List, cmd: "insertUnorderedList" },
    { icon: ListOrdered, cmd: "insertOrderedList" },
    { icon: AlignLeft, cmd: "justifyLeft" },
    { icon: AlignCenter, cmd: "justifyCenter" },
    { icon: AlignRight, cmd: "justifyRight" },
    { icon: Link2, cmd: "createLink" },
    { icon: ImagePlus, cmd: "insertImage" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-bg/80 rounded-t-md">
      {tools.map(({ icon: Icon, cmd }) => (
        <button
          key={cmd}
          type="button"
          onClick={() => onFormat(cmd)}
          className="p-1.5 rounded text-muted hover:text-ink hover:bg-white"
          title={cmd}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

function asTree(items) {
  if ((items || []).some((c) => Array.isArray(c.children))) return items || [];
  const list = items || [];
  const roots = list.filter((c) => !c.parent);
  return roots.map((c) => ({
    ...c,
    children: list.filter((x) => idOf(x.parent) === idOf(c)),
  }));
}

function mapProductToForm(p) {
  const images = Array.isArray(p.images)
    ? p.images.map((img, i) =>
        typeof img === "string" ? { url: img, isPrimary: i === 0 } : { url: img.url, isPrimary: !!img.isPrimary }
      )
    : [];

  let attributes = [];
  if (Array.isArray(p.optionTypes) && p.optionTypes.length) {
    attributes = p.optionTypes.map((o) => ({
      name: o.name,
      values: [...(o.values || [])],
    }));
  } else if (Array.isArray(p.variants) && p.variants.length) {
    const map = {};
    p.variants.forEach((v) => {
      const attrs = v.attributes && typeof v.attributes === "object" ? v.attributes : {};
      Object.entries(attrs).forEach(([k, val]) => {
        if (!map[k]) map[k] = new Set();
        map[k].add(String(val));
      });
      if (v.color) {
        if (!map.Color) map.Color = new Set();
        map.Color.add(v.color);
      }
      if (v.storage) {
        if (!map.Storage) map.Storage = new Set();
        map.Storage.add(v.storage);
      }
    });
    attributes = Object.entries(map).map(([name, set]) => ({ name, values: [...set] }));
  }
  if (!attributes.length) attributes = DEFAULT_ATTRIBUTES.map((a) => ({ ...a, values: [...a.values] }));

  const variants = (p.variants || []).map((v) => {
    const attrs = v.attributes && typeof v.attributes === "object" ? { ...v.attributes } : {};
    if (v.color && !attrs.Color) attrs.Color = v.color;
    if (v.storage && !attrs.Storage) attrs.Storage = v.storage;
    return {
      attributes: attrs,
      sku: v.sku || "",
      price: v.mrp ?? v.sellingPrice ?? v.price ?? "",
      offerPrice: v.offerPrice ?? v.sellingPrice ?? "",
      stock: v.stock ?? 0,
      status: v.status !== "INACTIVE",
    };
  });

  const categoryId = idOf(p.category);

  const specs = Array.isArray(p.specifications) ? p.specifications : [];
  const hsnSpec = specs.find((s) => /hsn/i.test(s.key || ""));
  const originSpec = specs.find((s) => /country of origin/i.test(s.key || ""));

  return {
    ...blankForm(),
    name: p.name || "",
    slug: p.slug || "",
    sku: p.sku || "",
    brandId: idOf(p.brand),
    categoryId,
    subCategoryId: "",
    shortDescription: p.shortDescription || "",
    description: p.description || "",
    images,
    attributes,
    variants,
    tax: String(p.tax ?? 18),
    minStock: String(p.minStock ?? 5),
    status: p.status || "DRAFT",
    featured: !!p.featured,
    warranty: p.warranty || "1 Year",
    returnPolicy: String(p.returnWindowDays ?? 7),
    condition: p.condition === "refurbished" ? "refurbished" : "new",
    countryOfOrigin: originSpec?.value || "India",
    tags: Array.isArray(p.seo?.keywords) ? p.seo.keywords : [],
    price: p.price ?? "",
    stock: p.stock ?? 0,
    hsn: hsnSpec?.value || "",
    _existingSpecs: specs,
  };
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const slugTouched = useRef(false);
  const descRef = useRef(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState(blankForm);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showAllVariants, setShowAllVariants] = useState(false);
  const [attrModal, setAttrModal] = useState(false);
  const [attrDraft, setAttrDraft] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const meta = useAsync(async () => {
    const [c, b] = await Promise.all([categoriesApi.tree(), brandsApi.list()]);
    return { categories: asTree(c.data || []), brands: b.data || [] };
  }, []);

  const existing = useAsync(
    async () => {
      if (!id) return null;
      const res = await productsApi.get(id);
      return res.data;
    },
    [id]
  );

  useEffect(() => {
    if (!existing.data) return;
    const mapped = mapProductToForm(existing.data);
    setForm(mapped);
    slugTouched.current = true;
    if (descRef.current) descRef.current.innerText = mapped.description || "";
  }, [existing.data]);

  useEffect(() => {
    if (!existing.data || !meta.data?.categories?.length) return;
    const categoryId = idOf(existing.data.category);
    const tree = meta.data.categories;
    let parentId = "";
    let subId = "";
    for (const root of tree) {
      if (idOf(root) === categoryId) {
        parentId = categoryId;
        break;
      }
      const child = (root.children || []).find((c) => idOf(c) === categoryId);
      if (child) {
        parentId = idOf(root);
        subId = categoryId;
        break;
      }
    }
    if (parentId) {
      setForm((f) => ({ ...f, categoryId: parentId, subCategoryId: subId }));
    }
  }, [existing.data, meta.data]);

  useEffect(() => {
    if (!isEdit && meta.data && !form.brandId) {
      setForm((f) => ({
        ...f,
        brandId: idOf(meta.data.brands[0]) || "",
        categoryId: idOf(meta.data.categories[0]) || "",
      }));
    }
  }, [meta.data, isEdit, form.brandId]);

  const parentCategories = meta.data?.categories || [];
  const subCategories = useMemo(() => {
    const parent = parentCategories.find((c) => idOf(c) === form.categoryId);
    return parent?.children || [];
  }, [parentCategories, form.categoryId]);

  const visibleVariants = showAllVariants ? form.variants : form.variants.slice(0, 5);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onNameChange(value) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched.current ? f.slug : slugify(value),
    }));
  }

  function onFormat(cmd) {
    if (cmd === "createLink") {
      const url = window.prompt("Enter URL");
      if (url) document.execCommand(cmd, false, url);
      return;
    }
    if (cmd === "insertImage") {
      const url = window.prompt("Enter image URL");
      if (url) document.execCommand(cmd, false, url);
      return;
    }
    document.execCommand(cmd, false, null);
    if (descRef.current) set("description", descRef.current.innerText || "");
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      setUploadError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const uploaded = [];
      for (const file of files.slice(0, remaining)) {
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} exceeds 5MB`);
        const res = await uploadsApi.image(file, "products");
        uploaded.push(res.data.url);
      }
      setForm((f) => {
        const next = [
          ...f.images,
          ...uploaded.map((url, i) => ({ url, isPrimary: f.images.length === 0 && i === 0 })),
        ];
        if (next.length && !next.some((img) => img.isPrimary)) next[0].isPrimary = true;
        return { ...f, images: next };
      });
    } catch (err) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(index) {
    setForm((f) => {
      const next = f.images.filter((_, i) => i !== index);
      if (next.length && !next.some((img) => img.isPrimary)) next[0].isPrimary = true;
      return { ...f, images: next };
    });
  }

  function setCover(index) {
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    }));
  }

  function generateVariants() {
    const combos = cartesian(form.attributes.filter((a) => a.name && a.values?.length));
    if (!combos.length) {
      alert("Add at least one attribute with values first");
      return;
    }
    const base = slugify(form.slug || form.name || "PROD")
      .replace(/-/g, "")
      .slice(0, 10)
      .toUpperCase() || "PROD";
    const existingMap = Object.fromEntries(form.variants.map((v) => [JSON.stringify(v.attributes), v]));
    const next = combos.map((attrs) => {
      const key = JSON.stringify(attrs);
      if (existingMap[key]) return existingMap[key];
      const skuParts = [base, ...Object.values(attrs).map(abbr)];
      return {
        attributes: attrs,
        sku: skuParts.join("-"),
        price: form.price || "",
        offerPrice: form.price || "",
        stock: "10",
        status: true,
      };
    });
    setForm((f) => ({ ...f, variants: next }));
    setShowAllVariants(false);
  }

  function updateVariant(index, field, value) {
    setForm((f) => {
      const next = [...f.variants];
      next[index] = { ...next[index], [field]: value };
      return { ...f, variants: next };
    });
  }

  function removeVariant(index) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  }

  function openManageAttributes() {
    setAttrDraft(form.attributes.map((a) => ({ name: a.name, values: a.values.join(", ") })));
    setAttrModal(true);
  }

  function saveAttributes() {
    const attributes = attrDraft
      .map((a) => ({
        name: a.name.trim(),
        values: String(a.values || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((a) => a.name);
    setForm((f) => ({ ...f, attributes }));
    setAttrModal(false);
  }

  function addTag(raw) {
    const value = String(raw || "").trim().replace(/,/g, "");
    if (!value || form.tags.includes(value)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, value] }));
    setTagInput("");
  }

  function buildBody(statusOverride) {
    const status = statusOverride || form.status;
    const categoryId = form.subCategoryId || form.categoryId;
    const activeVariants = form.variants.filter((v) => String(v.sku || "").trim());
    const firstVariant = activeVariants[0];
    const price = Number(firstVariant?.offerPrice || firstVariant?.price || form.price) || 0;
    const originalPrice = Number(firstVariant?.price || form.price) || price;
    const stock = activeVariants.length
      ? activeVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : Number(form.stock) || 0;

    const baseSku =
      form.sku.trim() ||
      firstVariant?.sku ||
      slugify(form.slug || form.name)
        .replace(/-/g, "")
        .toUpperCase()
        .slice(0, 20) ||
      "PRODUCT";

    const keptSpecs = (form._existingSpecs || []).filter(
      (s) => !/hsn/i.test(s.key || "") && !/country of origin/i.test(s.key || "")
    );
    if (form.hsn.trim()) keptSpecs.push({ key: "HSN / SAC", value: form.hsn.trim() });
    if (form.countryOfOrigin) keptSpecs.push({ key: "Country of Origin", value: form.countryOfOrigin });

    return {
      sku: baseSku,
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      categoryId,
      brandId: form.brandId,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim() || form.shortDescription.trim() || form.name.trim(),
      price,
      originalPrice: originalPrice > price ? originalPrice : undefined,
      tax: Number(form.tax) || 0,
      stock,
      minStock: Number(form.minStock) || 0,
      status,
      featured: !!form.featured,
      condition: form.condition || "new",
      warranty: form.warranty || undefined,
      returnWindowDays: form.returnPolicy === "" ? undefined : Number(form.returnPolicy),
      images: form.images,
      optionTypes: form.attributes.map((a) => ({ name: a.name, values: a.values })),
      seo: { keywords: form.tags },
      specifications: keptSpecs,
      defaultVariantSku: firstVariant?.sku || undefined,
      variants: activeVariants.map((v, i) => ({
        sku: String(v.sku).trim().toUpperCase(),
        mrp: Number(v.price) || Number(v.offerPrice) || 0,
        sellingPrice: Number(v.offerPrice) || Number(v.price) || 0,
        offerPrice: v.offerPrice === "" || v.offerPrice == null ? undefined : Number(v.offerPrice),
        stock: Number(v.stock) || 0,
        status: v.status ? "ACTIVE" : "INACTIVE",
        isDefault: i === 0,
        attributes: v.attributes || {},
        maxOrderQty: form.maxOrderQty === "" ? undefined : Number(form.maxOrderQty),
        images: [],
      })),
    };
  }

  async function save(statusOverride) {
    const body = buildBody(statusOverride);
    if (!body.name || !body.categoryId || !body.brandId) {
      alert("Product name, brand and category are required");
      return;
    }
    if (!body.variants.length && (body.price === 0 || Number.isNaN(body.price))) {
      alert("Add a price or generate variants with pricing");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) await productsApi.update(id, body);
      else await productsApi.create(body);
      navigate("/products");
    } catch (e) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if ((meta.loading && !meta.data) || (isEdit && existing.loading && !existing.data)) {
    return <LoadingState label={isEdit ? "Loading product…" : "Loading form…"} />;
  }
  if (meta.error && !meta.data) return <ErrorState message={meta.error} onRetry={meta.reload} />;
  if (isEdit && existing.error && !existing.data) {
    return <ErrorState message={existing.error} onRetry={existing.reload} />;
  }

  const imageProgress = Math.min(100, (form.images.length / MAX_IMAGES) * 100);

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <nav className="text-xs text-muted mb-1.5 flex items-center gap-1.5">
            <Link to="/" className="hover:text-primary">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary">
              Products
            </Link>
            <span>/</span>
            <span className="text-ink">{isEdit ? "Edit Product" : "Add Product"}</span>
          </nav>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {isEdit ? "Edit Product" : "Add Product"}
          </h1>
          <p className="text-sm text-muted mt-1">Create a new product with variants and pricing</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/products")} disabled={saving}>
            Discard
          </Button>
          <Button variant="secondary" type="button" onClick={() => save("DRAFT")} disabled={saving}>
            Save as Draft
          </Button>
          <Button type="button" onClick={() => save("ACTIVE")} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* 1. Basic Information */}
        <SectionCard number={1} title="Basic Information" className="xl:col-span-7">
          <FormField>
            <Label required>Product Name</Label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Apple MacBook Air M4"
            />
          </FormField>
          <FormField>
            <Label required>Slug</Label>
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => {
                slugTouched.current = true;
                set("slug", slugify(e.target.value));
              }}
              placeholder="e.g. apple-macbook-air-m4"
            />
            <p className="text-[11px] text-muted mt-1">URL friendly unique text</p>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField>
              <Label required>Brand</Label>
              <select className={inputCls} value={form.brandId} onChange={(e) => set("brandId", e.target.value)}>
                <option value="">Select brand</option>
                {(meta.data?.brands || []).map((b) => (
                  <option key={idOf(b)} value={idOf(b)}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField>
              <Label required>Category</Label>
              <select
                className={inputCls}
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, subCategoryId: "" }))}
              >
                <option value="">Select category</option>
                {parentCategories.map((c) => (
                  <option key={idOf(c)} value={idOf(c)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField>
              <Label>Sub Category</Label>
              <select
                className={inputCls}
                value={form.subCategoryId}
                onChange={(e) => set("subCategoryId", e.target.value)}
                disabled={!subCategories.length}
              >
                <option value="">{subCategories.length ? "Select sub category" : "No sub categories"}</option>
                {subCategories.map((c) => (
                  <option key={idOf(c)} value={idOf(c)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField>
            <div className="flex items-center justify-between">
              <Label>Short Description</Label>
              <span className="text-[11px] text-muted">
                {form.shortDescription.length}/{SHORT_DESC_MAX}
              </span>
            </div>
            <textarea
              className={inputCls}
              rows={2}
              maxLength={SHORT_DESC_MAX}
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="Brief product summary for listings"
            />
          </FormField>
          <div className="mb-1">
            <div className="flex items-center justify-between mb-1.5">
              <Label>Description</Label>
              <span className="text-[11px] text-muted">
                {form.description.length}/{DESC_MAX}
              </span>
            </div>
            <div className="border border-border rounded-md overflow-hidden bg-white">
              <RichTextToolbar onFormat={onFormat} />
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[140px] px-3 py-2 text-sm outline-none"
                onInput={(e) => {
                  const text = e.currentTarget.innerText || "";
                  if (text.length <= DESC_MAX) set("description", text);
                }}
                data-placeholder="Write a detailed product description…"
              />
            </div>
          </div>
        </SectionCard>

        {/* 2. Product Media */}
        <SectionCard number={2} title="Product Media" className="xl:col-span-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className={clsx(
              "border-2 border-dashed rounded-lg px-4 py-8 text-center cursor-pointer transition-colors",
              dragOver ? "border-primary bg-primary-light/40" : "border-border bg-bg/50 hover:border-primary/40"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-primary-light text-primary mx-auto mb-3 flex items-center justify-center">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            </div>
            <p className="text-sm font-medium text-ink">Drag & drop images here or click to browse</p>
            <p className="text-[11px] text-muted mt-1.5">
              JPG, PNG, WEBP (Max 5MB) · Recommended 1200×1200px
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {form.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {form.images.map((img, i) => (
                <div
                  key={`${img.url}-${i}`}
                  className="relative aspect-square rounded-lg border border-border overflow-hidden bg-bg group"
                >
                  <img src={mediaUrl(img.url)} alt="" className="w-full h-full object-cover" />
                  {img.isPrimary && (
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(i);
                    }}
                    className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCover(i);
                      }}
                      className="absolute bottom-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/90 text-ink opacity-0 group-hover:opacity-100"
                    >
                      Set cover
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted mb-1.5">
              <span>
                {form.images.length} of {MAX_IMAGES} images uploaded
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-bg overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${imageProgress}%` }} />
            </div>
          </div>
          {uploadError && <p className="text-[11px] text-danger mt-2">{uploadError}</p>}
        </SectionCard>

        {/* 3. Variants */}
        <SectionCard
          number={3}
          title="Product Variants and Attributes"
          className="xl:col-span-7"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" type="button" onClick={openManageAttributes}>
                Manage Attributes
              </Button>
              <Button size="sm" type="button" onClick={generateVariants}>
                Generate Variants
              </Button>
            </div>
          }
        >
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted mb-2">Selected Attributes</p>
            <div className="flex flex-wrap gap-2">
              {form.attributes.map((attr, i) => (
                <span
                  key={`${attr.name}-${i}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-light text-primary-dark text-xs font-medium"
                >
                  {attr.name} ({attr.values.length} values)
                  <button
                    type="button"
                    className="hover:text-danger"
                    onClick={() =>
                      setForm((f) => ({ ...f, attributes: f.attributes.filter((_, idx) => idx !== i) }))
                    }
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={openManageAttributes}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-border text-xs font-medium text-muted hover:text-primary hover:border-primary/40"
              >
                <Plus size={12} /> Add Attribute
              </button>
            </div>
          </div>

          {form.variants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-bg/40 px-4 py-10 text-center">
              <p className="text-sm text-muted mb-3">No variants yet. Configure attributes, then generate combinations.</p>
              <Button size="sm" type="button" onClick={generateVariants}>
                Generate Variants
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg/80 border-b border-border text-left">
                      {form.attributes.map((a) => (
                        <th key={a.name} className="px-3 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">
                          {a.name}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">SKU</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">Price (₹)</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">
                        Offer Price (₹)
                      </th>
                      <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">Stock</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">Status</th>
                      <th className="px-3 py-2.5 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleVariants.map((v) => {
                      const idx = form.variants.indexOf(v);
                      return (
                        <tr key={`${v.sku}-${idx}`} className="border-b border-border last:border-0">
                          {form.attributes.map((a) => (
                            <td key={a.name} className="px-3 py-2.5">
                              {a.name.toLowerCase() === "color" ? (
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
                                    style={{ background: colorHex(v.attributes?.[a.name]) }}
                                  />
                                  {v.attributes?.[a.name] || "—"}
                                </span>
                              ) : (
                                v.attributes?.[a.name] || "—"
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2.5">
                            <input
                              className="w-36 text-xs font-mono border border-border rounded px-2 py-1 bg-white"
                              value={v.sku}
                              onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              className="w-24 text-sm border border-border rounded px-2 py-1 bg-white"
                              value={v.price}
                              onChange={(e) => updateVariant(idx, "price", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              className="w-24 text-sm border border-border rounded px-2 py-1 bg-white"
                              value={v.offerPrice}
                              onChange={(e) => updateVariant(idx, "offerPrice", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              className="w-16 text-sm border border-border rounded px-2 py-1 bg-white"
                              value={v.stock}
                              onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Toggle checked={!!v.status} onChange={(val) => updateVariant(idx, "status", val)} />
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => removeVariant(idx)}
                              className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger-light"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {form.variants.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllVariants((s) => !s)}
                  className="mt-3 text-sm text-primary font-medium inline-flex items-center gap-1"
                >
                  {showAllVariants ? "Show fewer variants" : `View All ${form.variants.length} Variants`}
                  <ChevronDown size={14} className={clsx(showAllVariants && "rotate-180")} />
                </button>
              )}
            </>
          )}
        </SectionCard>

        {/* 4 + 5 right column */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <SectionCard number={4} title="Pricing & Inventory">
            <div className="grid grid-cols-2 gap-3">
              <FormField>
                <Label>Tax Class</Label>
                <select className={inputCls} value={form.tax} onChange={(e) => set("tax", e.target.value)}>
                  <option value="0">GST 0%</option>
                  <option value="5">GST 5%</option>
                  <option value="12">GST 12%</option>
                  <option value="18">GST 18%</option>
                  <option value="28">GST 28%</option>
                </select>
              </FormField>
              <FormField>
                <Label>HSN / SAC Code</Label>
                <input
                  className={inputCls}
                  value={form.hsn}
                  onChange={(e) => set("hsn", e.target.value)}
                  placeholder="e.g. 8471"
                />
              </FormField>
            </div>
            <div className="flex flex-wrap gap-4 mb-3 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.trackInventory}
                  onChange={(e) => set("trackInventory", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Track Inventory
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.allowBackorders}
                  onChange={(e) => set("allowBackorders", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Allow Backorders
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField>
                <Label>Minimum Order Qty</Label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.minOrderQty}
                  onChange={(e) => set("minOrderQty", e.target.value)}
                />
              </FormField>
              <FormField>
                <Label>Maximum Order Qty</Label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.maxOrderQty}
                  onChange={(e) => set("maxOrderQty", e.target.value)}
                  placeholder="—"
                />
              </FormField>
              <FormField>
                <Label>Low Stock Threshold</Label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.minStock}
                  onChange={(e) => set("minStock", e.target.value)}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <FormField>
                <Label>Unit</Label>
                <select className={inputCls} value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                  <option value="Pcs">Pcs</option>
                  <option value="Box">Box</option>
                  <option value="Set">Set</option>
                  <option value="Kg">Kg</option>
                </select>
              </FormField>
              <label className="inline-flex items-center gap-2 text-sm mb-3.5">
                <input
                  type="checkbox"
                  checked={form.soldIndividually}
                  onChange={(e) => set("soldIndividually", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Sold Individually
              </label>
            </div>
            {!form.variants.length && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
                <FormField>
                  <Label required>Base Price (₹)</Label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="0"
                  />
                </FormField>
                <FormField>
                  <Label>Base Stock</Label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value)}
                  />
                </FormField>
              </div>
            )}
          </SectionCard>

          <SectionCard number={5} title="Product Status">
            <div className="grid grid-cols-2 gap-3">
              <FormField>
                <Label>Status</Label>
                <div className="relative">
                  <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  {form.status === "ACTIVE" && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-success pointer-events-none" />
                  )}
                </div>
              </FormField>
              <FormField>
                <Label>Visibility</Label>
                <select
                  className={inputCls}
                  value={form.visibility}
                  onChange={(e) => set("visibility", e.target.value)}
                >
                  <option value="catalog_search">Catalog & Search</option>
                  <option value="catalog">Catalog only</option>
                  <option value="search">Search only</option>
                  <option value="hidden">Hidden</option>
                </select>
              </FormField>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              Featured Product
            </label>
          </SectionCard>
        </div>

        {/* 6. Additional Information */}
        <SectionCard number={6} title="Additional Information" className="xl:col-span-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormField>
              <Label>Warranty</Label>
              <select className={inputCls} value={form.warranty} onChange={(e) => set("warranty", e.target.value)}>
                <option value="No Warranty">No Warranty</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
                <option value="2 Years">2 Years</option>
                <option value="3 Years">3 Years</option>
              </select>
            </FormField>
            <FormField>
              <Label>Return Policy</Label>
              <select
                className={inputCls}
                value={form.returnPolicy}
                onChange={(e) => set("returnPolicy", e.target.value)}
              >
                <option value="0">No Returns</option>
                <option value="7">7 Days Return</option>
                <option value="10">10 Days Return</option>
                <option value="15">15 Days Return</option>
                <option value="30">30 Days Return</option>
              </select>
            </FormField>
            <FormField>
              <Label>Condition</Label>
              <select className={inputCls} value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                <option value="new">New</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </FormField>
            <FormField>
              <Label>Country of Origin</Label>
              <select
                className={inputCls}
                value={form.countryOfOrigin}
                onChange={(e) => set("countryOfOrigin", e.target.value)}
              >
                <option value="India">India</option>
                <option value="China">China</option>
                <option value="USA">USA</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Taiwan">Taiwan</option>
                <option value="Other">Other</option>
              </select>
            </FormField>
          </div>
          <FormField className="mb-0">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg border border-border text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                    className="text-muted hover:text-danger"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <input
              className={inputCls}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="laptop, apple, macbook"
            />
            <p className="text-[11px] text-muted mt-1">Press Enter to add multiple tags</p>
          </FormField>
        </SectionCard>
      </div>

      <Modal open={attrModal} onClose={() => setAttrModal(false)} title="Manage Attributes" width="max-w-lg">
        <p className="text-xs text-muted mb-3">Comma-separate values for each attribute (e.g. Silver, Space Black).</p>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {attrDraft.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <input
                className={inputCls}
                placeholder="Name"
                value={row.name}
                onChange={(e) => {
                  const next = [...attrDraft];
                  next[i] = { ...row, name: e.target.value };
                  setAttrDraft(next);
                }}
              />
              <input
                className={inputCls}
                placeholder="Values, comma separated"
                value={row.values}
                onChange={(e) => {
                  const next = [...attrDraft];
                  next[i] = { ...row, values: e.target.value };
                  setAttrDraft(next);
                }}
              />
              <button
                type="button"
                className="p-2 text-muted hover:text-danger"
                onClick={() => setAttrDraft(attrDraft.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-primary font-medium inline-flex items-center gap-1"
          onClick={() => setAttrDraft([...attrDraft, { name: "", values: "" }])}
        >
          <Plus size={14} /> Add attribute
        </button>
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border">
          <Button variant="secondary" type="button" onClick={() => setAttrModal(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={saveAttributes}>
            Apply
          </Button>
        </div>
      </Modal>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
