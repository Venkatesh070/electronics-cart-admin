import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bold,
  Calendar,
  Check,
  ExternalLink,
  Globe,
  ImagePlus,
  Italic,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Mail,
  Phone,
  Underline,
  Upload,
  X,
} from "lucide-react";
import { brandsApi, uploadsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { mediaUrl } from "../utils/format";
import { Button, Card, ErrorState, inputCls, LoadingState } from "../components/ui";
import clsx from "clsx";

const SHORT_MAX = 160;
const DESC_MAX = 2000;
const UPLOAD_MAX_MB = 5;

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

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input {...props} className={clsx(inputCls, "pl-9", props.className)} />
    </div>
  );
}

function UploadBox({ label, required, hint, uploadLabel, value, onChange, onClear, wide, square }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList) {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    if (file.size > UPLOAD_MAX_MB * 1024 * 1024) {
      setError(`Max ${UPLOAD_MAX_MB}MB allowed`);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const res = await uploadsApi.image(file, "brands");
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
      <Label required={required}>{label}</Label>
      {value ? (
        <div
          className={clsx(
            "relative rounded-lg border border-border overflow-hidden bg-bg",
            wide ? "aspect-[4.8/1]" : square ? "aspect-square max-w-[160px]" : "aspect-square max-w-[200px]"
          )}
        >
          <img src={mediaUrl(value)} alt="" className="w-full h-full object-contain bg-white p-2" />
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
            "border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors px-3 py-6",
            wide ? "min-h-[120px]" : "min-h-[140px]",
            dragOver ? "border-primary bg-primary-light/40" : "border-border bg-bg/50 hover:border-primary/40"
          )}
        >
          <div className="w-9 h-9 rounded-full bg-primary-light text-primary mx-auto mb-2.5 flex items-center justify-center">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          </div>
          <p className="text-sm font-medium text-ink">{uploadLabel}</p>
          <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{hint}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
      {error && <p className="text-[11px] text-danger mt-1.5">{error}</p>}
    </div>
  );
}

const blankForm = () => ({
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  logo: "",
  banner: "",
  icon: "",
  website: "",
  supportEmail: "",
  supportPhone: "",
  countryOfOrigin: "",
  establishedYear: "",
  status: "ACTIVE",
  visibility: "public",
  featured: false,
});

const TIPS = [
  "Use a high quality logo for best visibility.",
  "Keep brand name short and unique.",
  "Add a banner image to make your brand page attractive.",
  "Brands help customers trust your products.",
];

export default function BrandForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const slugTouched = useRef(false);
  const descRef = useRef(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const existing = useAsync(
    async () => {
      if (!id) return null;
      const res = await brandsApi.get(id);
      return res.data;
    },
    [id]
  );

  useEffect(() => {
    if (!existing.data) return;
    const b = existing.data;
    setForm({
      name: b.name || "",
      slug: b.slug || "",
      shortDescription: b.shortDescription || "",
      description: b.description || "",
      logo: b.logo || "",
      banner: b.banner || "",
      icon: b.icon || "",
      website: b.website || "",
      supportEmail: b.supportEmail || "",
      supportPhone: b.supportPhone || "",
      countryOfOrigin: b.countryOfOrigin || "",
      establishedYear: b.establishedYear != null ? String(b.establishedYear) : "",
      status: b.status || "ACTIVE",
      visibility: b.visibility || "public",
      featured: !!b.featured,
    });
    slugTouched.current = true;
    if (descRef.current) descRef.current.innerText = b.description || "";
  }, [existing.data]);

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

  function buildBody(statusOverride) {
    return {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim() || form.shortDescription.trim() || form.name.trim(),
      logo: form.logo || undefined,
      banner: form.banner || undefined,
      icon: form.icon || undefined,
      website: form.website.trim() || undefined,
      supportEmail: form.supportEmail.trim() || undefined,
      supportPhone: form.supportPhone.trim() || undefined,
      countryOfOrigin: form.countryOfOrigin || undefined,
      establishedYear: form.establishedYear === "" ? undefined : Number(form.establishedYear),
      status: statusOverride || form.status,
      visibility: form.visibility,
      featured: !!form.featured,
    };
  }

  async function save(statusOverride) {
    if (!form.name.trim()) {
      alert("Brand name is required");
      return;
    }
    if (!form.logo && !(statusOverride === "DRAFT" || form.status === "DRAFT")) {
      alert("Brand logo is required");
      return;
    }
    setSaving(true);
    try {
      const body = buildBody(statusOverride);
      if (isEdit) await brandsApi.update(id, body);
      else await brandsApi.create(body);
      navigate("/brands");
    } catch (e) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && existing.loading && !existing.data) {
    return <LoadingState label="Loading brand…" />;
  }
  if (isEdit && existing.error && !existing.data) {
    return <ErrorState message={existing.error} onRetry={existing.reload} />;
  }

  const previewName = form.name.trim() || "Apple";
  const previewDesc =
    form.shortDescription.trim() || "Think Different. Innovative products for everyone.";
  const previewLogo = form.logo || form.icon;

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <nav className="text-xs text-muted mb-1.5 flex items-center gap-1.5">
            <Link to="/" className="hover:text-primary">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/brands" className="hover:text-primary">
              Brands
            </Link>
            <span>/</span>
            <span className="text-ink">{isEdit ? "Edit Brand" : "Add Brand"}</span>
          </nav>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {isEdit ? "Edit Brand" : "Add Brand"}
          </h1>
          <p className="text-sm text-muted mt-1">Create a new brand to manage your products</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/brands")} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" type="button" onClick={() => save("DRAFT")} disabled={saving}>
            Save as Draft
          </Button>
          <Button type="button" onClick={() => save("ACTIVE")} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Brand" : "Save Brand"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 flex flex-col gap-4">
          <SectionCard number={1} title="Brand Information">
            <FormField>
              <Label required>Brand Name</Label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Apple"
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
                placeholder="e.g. apple"
              />
              <p className="text-[11px] text-muted mt-1">URL friendly unique text</p>
            </FormField>
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
                placeholder="Brief brand summary"
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
                  data-placeholder="Write a detailed brand description…"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard number={2} title="Brand Media">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UploadBox
                label="Brand Logo"
                required
                uploadLabel="Upload Logo"
                hint={`PNG, SVG, JPG (Max. ${UPLOAD_MAX_MB}MB) · Recommended: 512×512px`}
                value={form.logo}
                onChange={(url) => set("logo", url)}
                onClear={() => set("logo", "")}
              />
              <UploadBox
                label="Brand Banner"
                uploadLabel="Upload Banner"
                hint={`JPG, PNG, WEBP (Max. ${UPLOAD_MAX_MB}MB) · Recommended: 1920×400px`}
                value={form.banner}
                onChange={(url) => set("banner", url)}
                onClear={() => set("banner", "")}
                wide
              />
              <UploadBox
                label="Brand Icon"
                uploadLabel="Upload Icon"
                hint={`PNG, JPG (Max. ${UPLOAD_MAX_MB}MB) · Recommended: 200×200px`}
                value={form.icon}
                onChange={(url) => set("icon", url)}
                onClear={() => set("icon", "")}
                square
              />
            </div>
            <p className="text-[11px] text-muted mt-3">
              Logo is shown across the website. Banner appears on the brand page. Icon is used in compact listings.
            </p>
          </SectionCard>

          <SectionCard number={3} title="Brand Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <Label>Website</Label>
                <IconInput
                  icon={Globe}
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://www.apple.com"
                />
              </FormField>
              <FormField>
                <Label>Customer Care Email</Label>
                <IconInput
                  icon={Mail}
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => set("supportEmail", e.target.value)}
                  placeholder="support@apple.com"
                />
              </FormField>
              <FormField>
                <Label>Customer Care Phone</Label>
                <IconInput
                  icon={Phone}
                  value={form.supportPhone}
                  onChange={(e) => set("supportPhone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </FormField>
              <FormField>
                <Label>Country of Origin</Label>
                <select
                  className={inputCls}
                  value={form.countryOfOrigin}
                  onChange={(e) => set("countryOfOrigin", e.target.value)}
                >
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="China">China</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Germany">Germany</option>
                  <option value="Taiwan">Taiwan</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
              <FormField className="sm:col-span-2 sm:max-w-xs">
                <Label>Established Year</Label>
                <IconInput
                  icon={Calendar}
                  type="number"
                  min="1800"
                  max="2100"
                  value={form.establishedYear}
                  onChange={(e) => set("establishedYear", e.target.value)}
                  placeholder="e.g. 1976"
                />
              </FormField>
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4">
          <SectionCard number={4} title="Publishing">
            <FormField>
              <Label required>Status</Label>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { value: "ACTIVE", label: "Active", tone: "text-success" },
                  { value: "INACTIVE", label: "Inactive" },
                  { value: "DRAFT", label: "Draft" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={clsx(
                      "inline-flex items-center gap-2 cursor-pointer",
                      form.status === opt.value && opt.tone
                    )}
                  >
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
              <Label required>Visibility</Label>
              <div className="space-y-2.5">
                {[
                  { value: "public", label: "Public", sub: "Visible to all customers" },
                  { value: "private", label: "Private", sub: "Only visible to specific users" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={clsx(
                      "flex items-start gap-2.5 cursor-pointer",
                      form.visibility === opt.value && "text-success"
                    )}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      checked={form.visibility === opt.value}
                      onChange={() => set("visibility", opt.value)}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <span>
                      <span className="block text-sm font-medium">{opt.label}</span>
                      <span className="block text-[11px] text-muted">{opt.sub}</span>
                    </span>
                  </label>
                ))}
              </div>
            </FormField>
            <label className="inline-flex items-center gap-2 text-sm pt-1 border-t border-border">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              Feature on homepage
            </label>
          </SectionCard>

          <SectionCard number={5} title="Brand Preview">
            <div className="rounded-lg border border-border bg-bg/40 p-4">
              <div className="flex items-start gap-3">
                {previewLogo ? (
                  <img
                    src={mediaUrl(previewLogo)}
                    alt=""
                    className="w-12 h-12 rounded-lg object-contain bg-white border border-border p-1"
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
                  if (form.slug) window.open(`/brands/${form.slug}`, "_blank");
                }}
              >
                View Brand Page <ExternalLink size={13} />
              </button>
            </div>
          </SectionCard>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-amber" />
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
