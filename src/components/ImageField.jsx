import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { uploadsApi } from "../api";
import { mediaUrl } from "../utils/format";

/**
 * Image picker that uploads to local backend storage.
 * - objectMode=false: value is string | string[]
 * - objectMode=true: value is { url, isPrimary }[]
 */
export default function ImageField({
  label = "Image",
  folder = "misc",
  value,
  onChange,
  multiple = false,
  objectMode = false,
  hint = "PNG, JPG or WebP up to 5MB",
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const items = (() => {
    if (!value) return [];
    if (objectMode) return Array.isArray(value) ? value : [];
    if (multiple) return (Array.isArray(value) ? value : []).map((url) => ({ url, isPrimary: false }));
    return [{ url: value, isPrimary: true }];
  })();

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const res = await uploadsApi.image(file, folder);
        uploaded.push(res.data.url);
      }
      if (objectMode) {
        const next = [
          ...items,
          ...uploaded.map((url, i) => ({ url, isPrimary: items.length === 0 && i === 0 })),
        ];
        if (!next.some((img) => img.isPrimary) && next.length) next[0].isPrimary = true;
        onChange(next);
      } else if (multiple) {
        onChange([...items.map((i) => i.url), ...uploaded]);
      } else {
        onChange(uploaded[0] || "");
      }
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index) {
    if (objectMode) {
      const next = items.filter((_, i) => i !== index);
      if (next.length && !next.some((img) => img.isPrimary)) next[0].isPrimary = true;
      onChange(next);
    } else if (multiple) {
      onChange(items.filter((_, i) => i !== index).map((i) => i.url));
    } else {
      onChange("");
    }
  }

  function setPrimary(index) {
    if (!objectMode) return;
    onChange(items.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  return (
    <div className="mb-4">
      {label && <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>}
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((img, i) => (
          <div key={`${img.url}-${i}`} className="relative w-20 h-20 rounded-md border border-border bg-bg overflow-hidden group">
            <img src={mediaUrl(img.url)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
            {objectMode && (
              <button
                type="button"
                title="Set as primary"
                onClick={() => setPrimary(i)}
                className={`absolute bottom-1 left-1 p-0.5 rounded ${img.isPrimary ? "bg-amber text-white" : "bg-black/50 text-white opacity-0 group-hover:opacity-100"}`}
              >
                <Star size={11} fill={img.isPrimary ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        ))}
        {(multiple || objectMode || !items.length) && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-md border border-dashed border-border bg-bg text-muted hover:text-ink hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-[10px] font-medium disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {uploading ? "Uploading" : "Upload"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple || objectMode}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {hint && !error && <p className="text-[11px] text-muted">{hint}</p>}
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
