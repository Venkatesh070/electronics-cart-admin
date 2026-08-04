import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Bold,
  ExternalLink,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Underline,
  Upload,
  X,
} from "lucide-react";
import { categoriesApi, uploadsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf, mediaUrl } from "../utils/format";
import { Button, Card, ErrorState, inputCls, LoadingState } from "../components/ui";
import clsx from "clsx";

const NAME_MAX = 100;
const SHORT_MAX = 160;
const DESC_MAX = 2000;
const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;
const META_KEYWORDS_MAX = 200;

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
        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shrink-0">
          {number}
        </span>
        <h2 className="font-display font-semibold text-ink text-[15px]">{title}</h2>
      </div>
      {children}
    </Card>
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

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

function blankForm(parent = "") {
  return {
    name: "",
    slug: "",
    parent,
    order: "0",
    shortDescription: "",
    description: "",
    image: "",
    banner: "",
    status: "ACTIVE",
    visibility: "public",
    showInMenu: true,
    featured: false,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  };
}

function UploadBox({
  label,
  hint,
  value,
  onChange,
  onClear,
  folder,
  maxMb,
  accept,
  wide,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList) {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Max ${maxMb}MB allowed`);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const res = await uploadsApi.image(file, folder);
      onChange(res.data.url);
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div
          className={clsx(
            "relative rounded-lg border border-border overflow-hidden bg-bg",
            wide ? "aspect-[4.8/1]" : "aspect-square max-w-[200px]"
          )}
        >
          <img src={mediaUrl(value)} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
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
          onClick={() => inputRef.current?.click()}
          className={clsx(
            "border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors px-4 py-8",
            wide ? "min-h-[140px]" : "min-h-[160px]",
            dragOver ? "border-primary bg-primary-light/40" : "border-border bg-bg/50 hover:border-primary/40"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary-light text-primary mx-auto mb-3 flex items-center justify-center">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          </div>
          <p className="text-sm font-medium text-ink">{wide ? "Upload Banner" : "Upload Icon"}</p>
          <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{hint}</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
      {error && <p className="text-[11px] text-danger mt-1.5">{error}</p>}
    </div>
  );
}

export default function CategoryForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const slugTouched = useRef(false);
  const descRef = useRef(null);
  const [form, setForm] = useState(() => blankForm(searchParams.get("parent") || ""));
  const [saving, setSaving] = useState(false);

  const tree = useAsync(async () => asTree((await categoriesApi.tree()).data || []), []);
  const existing = useAsync(
    async () => {
      if (!id) return null;
      const res = await categoriesApi.get(id);
      return res.data;
    },
    [id]
  );

  useEffect(() => {
    if (!existing.data) return;
    const c = existing.data;
    setForm({
      name: c.name || "",
      slug: c.slug || "",
      parent: idOf(c.parent) || "",
      order: String(c.order ?? 0),
      shortDescription: c.shortDescription || "",
      description: c.description || "",
      image: c.image || "",
      banner: c.banner || "",
      status: c.status || "ACTIVE",
      visibility: c.visibility || "public",
      showInMenu: c.showInMenu !== false,
      featured: !!c.featured,
      seoTitle: c.seo?.title || "",
      seoDescription: c.seo?.description || "",
      seoKeywords: c.seo?.keywords || "",
    });
    slugTouched.current = true;
    if (descRef.current) descRef.current.innerText = c.description || "";
  }, [existing.data]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onNameChange(value) {
    setForm((f) => ({
      ...f,
      name: value.slice(0, NAME_MAX),
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

  function buildBody(statusOverride) {
    return {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      parent: form.parent || null,
      order: Number(form.order) || 0,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim() || form.shortDescription.trim() || form.name.trim(),
      image: form.image || undefined,
      banner: form.banner || undefined,
      status: statusOverride || form.status,
      visibility: form.visibility,
      showInMenu: !!form.showInMenu,
      featured: !!form.featured,
      seo: {
        title: form.seoTitle.trim() || undefined,
        description: form.seoDescription.trim() || undefined,
        keywords: form.seoKeywords.trim() || undefined,
      },
    };
  }

  async function save(statusOverride) {
    if (!form.name.trim()) {
      alert("Category name is required");
      return;
    }
    setSaving(true);
    try {
      const body = buildBody(statusOverride);
      if (isEdit) await categoriesApi.update(id, body);
      else await categoriesApi.create(body);
      navigate("/categories");
    } catch (e) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if ((tree.loading && !tree.data) || (isEdit && existing.loading && !existing.data)) {
    return <LoadingState label={isEdit ? "Loading category…" : "Loading form…"} />;
  }
  if (tree.error && !tree.data) return <ErrorState message={tree.error} onRetry={tree.reload} />;
  if (isEdit && existing.error && !existing.data) {
    return <ErrorState message={existing.error} onRetry={existing.reload} />;
  }

  const parents = (tree.data || []).filter((c) => idOf(c) !== id);
  const previewName = form.name.trim() || "Laptops";
  const previewDesc =
    form.shortDescription.trim() || "High-performance laptops for work and play";

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <nav className="text-xs text-muted mb-1.5 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-primary">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary">
              Products
            </Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-primary">
              Categories
            </Link>
            <span>/</span>
            <span className="text-ink">{isEdit ? "Edit Category" : "Add Category"}</span>
          </nav>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {isEdit ? "Edit Category" : "Add Category"}
          </h1>
          <p className="text-sm text-muted mt-1">Create a new category to organize your products.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/categories")} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" type="button" onClick={() => save("DRAFT")} disabled={saving}>
            Save as Draft
          </Button>
          <Button type="button" onClick={() => save("ACTIVE")} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Category" : "Save Category"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 flex flex-col gap-4">
          <SectionCard number={1} title="Category Information">
            <FormField>
              <div className="flex items-center justify-between">
                <Label required>Category Name</Label>
                <span className="text-[11px] text-muted">
                  {form.name.length}/{NAME_MAX}
                </span>
              </div>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Laptops"
                maxLength={NAME_MAX}
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
                placeholder="e.g. laptops"
              />
              <p className="text-[11px] text-muted mt-1">URL friendly unique text</p>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <Label>Parent Category</Label>
                <select className={inputCls} value={form.parent} onChange={(e) => set("parent", e.target.value)}>
                  <option value="">Select Parent Category</option>
                  {parents.map((c) => (
                    <option key={idOf(c)} value={idOf(c)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField>
                <Label>Position</Label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.order}
                  onChange={(e) => set("order", e.target.value)}
                />
                <p className="text-[11px] text-muted mt-1">Display order in the list</p>
              </FormField>
            </div>

            <FormField>
              <div className="flex items-center justify-between">
                <Label>Short Description</Label>
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
                placeholder="Brief summary shown in category listings"
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
                  data-placeholder="Write a detailed category description…"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard number={2} title="Category Image">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
              <UploadBox
                label="Category Icon"
                hint="PNG, SVG, JPG, WEBP (Max. 5MB) · Recommended: 512×512px"
                value={form.image}
                onChange={(url) => set("image", url)}
                onClear={() => set("image", "")}
                folder="categories"
                maxMb={5}
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
              />
              <UploadBox
                label="Category Banner (Optional)"
                hint="JPG, PNG, WEBP (Max. 5MB) · Recommended: 1920×400px"
                value={form.banner}
                onChange={(url) => set("banner", url)}
                onClear={() => set("banner", "")}
                folder="categories"
                maxMb={5}
                accept="image/jpeg,image/png,image/webp"
                wide
              />
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4">
          <SectionCard number={3} title="Publishing">
            <FormField>
              <Label>Status</Label>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                  { value: "DRAFT", label: "Draft" },
                ].map((opt) => (
                  <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={form.status === opt.value}
                      onChange={() => set("status", opt.value)}
                      className="text-primary focus:ring-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </FormField>

            <FormField>
              <Label>Visibility</Label>
              <div className="space-y-2.5">
                {[
                  { value: "public", label: "Public", sub: "Visible to all customers" },
                  { value: "private", label: "Private", sub: "Only visible to specific users" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={form.visibility === opt.value}
                      onChange={() => set("visibility", opt.value)}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <span>
                      <span className="block text-sm text-ink">{opt.label}</span>
                      <span className="block text-[11px] text-muted">{opt.sub}</span>
                    </span>
                  </label>
                ))}
              </div>
            </FormField>

            <div className="flex items-center justify-between gap-3 py-2 border-t border-border">
              <div>
                <div className="text-sm font-medium text-ink">Menu Visibility</div>
                <div className="text-[11px] text-muted">Show in website navigation menu</div>
              </div>
              <Toggle checked={form.showInMenu} onChange={(v) => set("showInMenu", v)} />
            </div>

            <div className="flex items-center justify-between gap-3 py-2 border-t border-border">
              <div>
                <div className="text-sm font-medium text-ink">Featured Category</div>
                <div className="text-[11px] text-muted">Show in featured categories section</div>
              </div>
              <Toggle checked={form.featured} onChange={(v) => set("featured", v)} />
            </div>
          </SectionCard>

          <SectionCard number={4} title="Category Preview">
            <div className="rounded-lg border border-border bg-bg/40 p-4">
              <div className="flex items-start gap-3">
                {form.image ? (
                  <img
                    src={mediaUrl(form.image)}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-border bg-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary-light text-primary flex items-center justify-center font-display font-semibold text-sm">
                    {previewName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink truncate">{previewName}</div>
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{previewDesc}</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 text-sm text-primary font-medium inline-flex items-center gap-1.5 hover:underline"
                onClick={() => {
                  if (form.slug) window.open(`/categories/${form.slug}`, "_blank");
                }}
              >
                View Category Page <ExternalLink size={13} />
              </button>
            </div>
          </SectionCard>
        </div>

        <SectionCard number={5} title="SEO Information" className="xl:col-span-12">
          <FormField>
            <div className="flex items-center justify-between">
              <Label>Meta Title</Label>
              <span className="text-[11px] text-muted">
                {form.seoTitle.length}/{META_TITLE_MAX}
              </span>
            </div>
            <input
              className={inputCls}
              value={form.seoTitle}
              maxLength={META_TITLE_MAX}
              onChange={(e) => set("seoTitle", e.target.value)}
              placeholder="e.g. Buy Laptops Online | Electronics Cart"
            />
          </FormField>
          <FormField>
            <div className="flex items-center justify-between">
              <Label>Meta Description</Label>
              <span className="text-[11px] text-muted">
                {form.seoDescription.length}/{META_DESC_MAX}
              </span>
            </div>
            <textarea
              className={inputCls}
              rows={2}
              maxLength={META_DESC_MAX}
              value={form.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              placeholder="Short description for search engines"
            />
          </FormField>
          <FormField className="mb-0">
            <div className="flex items-center justify-between">
              <Label>Meta Keywords</Label>
              <span className="text-[11px] text-muted">
                {form.seoKeywords.length}/{META_KEYWORDS_MAX}
              </span>
            </div>
            <input
              className={inputCls}
              value={form.seoKeywords}
              maxLength={META_KEYWORDS_MAX}
              onChange={(e) => set("seoKeywords", e.target.value)}
              placeholder="laptops, notebooks, macbook, gaming laptop"
            />
          </FormField>
        </SectionCard>
      </div>

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
