import { useState } from "react";
import { Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { bannersApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, idOf, titleCase } from "../utils/format";
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

const EMPTY_FORM = {
  title: "",
  image: "",
  startDate: "",
  endDate: "",
  placement: "home",
  priority: 0,
  active: true,
  linkTarget: "",
};

function inputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
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

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal("new");
    setActionError("");
  }

  function openEdit(banner) {
    setForm({
      title: banner.title || "",
      image: banner.image || "",
      startDate: inputDate(banner.startDate),
      endDate: inputDate(banner.endDate),
      placement: banner.placement || "home",
      priority: Number(banner.priority) || 0,
      active: banner.active !== false,
      linkTarget: banner.linkTarget || "",
    });
    setModal(banner);
    setActionError("");
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    const payload = {
      title: form.title.trim(),
      image: form.image.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      placement: form.placement,
      priority: Number(form.priority),
      active: form.active,
      ...(form.linkTarget.trim() ? { linkTarget: form.linkTarget.trim() } : {}),
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
        title="Banners"
        description="Schedule homepage and category banners with placement and priority."
        action={<Button onClick={openCreate}><Plus size={14} /> Add banner</Button>}
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
                <div className="h-32 bg-gradient-to-br from-primary/15 to-amber/10 flex items-center justify-center overflow-hidden">
                  {banner.image ? (
                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={22} className="text-primary/50" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="font-medium text-ink">{banner.title}</div>
                    <Badge tone={statusTone(status)}>{status}</Badge>
                  </div>
                  <div className="text-xs text-muted mb-2">
                    {titleCase(banner.placement)} · Priority {banner.priority ?? 0}
                  </div>
                  <div className="text-xs font-mono text-muted mb-3">
                    {formatDate(banner.startDate)} → {formatDate(banner.endDate)}
                  </div>
                  {banner.linkTarget && (
                    <div className="text-xs text-muted truncate mb-3">Links to {banner.linkTarget}</div>
                  )}
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
          <EmptyState icon={ImageIcon} title="No banners" description="Add a banner to promote content on the storefront." action={<Button onClick={openCreate}><Plus size={14} /> Add banner</Button>} />
        </Card>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Add banner" : "Edit banner"} width="max-w-xl">
        <form onSubmit={save}>
          <Field label="Title">
            <input autoFocus className={inputCls} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Image URL">
            <input type="url" className={inputCls} value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Link target (optional)">
            <input className={inputCls} value={form.linkTarget} onChange={(event) => setForm({ ...form, linkTarget: event.target.value })} placeholder="/products/…" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Placement">
              <select className={inputCls} value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value })}>
                <option value="home">Home</option><option value="category">Category</option>
              </select>
            </Field>
            <Field label="Priority">
              <input type="number" className={inputCls} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} />
            </Field>
            <Field label="Start date">
              <input type="date" className={inputCls} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </Field>
            <Field label="End date">
              <input type="date" className={inputCls} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            Active
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.title.trim() || !form.image.trim() || !form.startDate || !form.endDate}>
              {modal === "new" ? "Add banner" : "Save banner"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
