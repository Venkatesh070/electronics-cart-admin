import { useState } from "react";
import { Mail, MessageSquare, Plus, Send, Trash2 } from "lucide-react";
import { campaignsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDateTime, idOf, titleCase } from "../utils/format";
import {
  PageHeader,
  Card,
  Table,
  Badge,
  Button,
  Modal,
  Field,
  inputCls,
  LoadingState,
  ErrorState,
} from "../components/ui";

const EMPTY_FORM = {
  name: "",
  channel: "email",
  subject: "",
  message: "",
  segment: "",
  scheduledAt: "",
};

function segmentPayload(value) {
  if (value === "customers") return { role: "customer" };
  if (value === "vip") return { minSpend: 50000 };
  if (value === "repeat") return { minOrders: 1 };
  return undefined;
}

function segmentLabel(segment) {
  if (!segment || !Object.keys(segment).length) return "All users";
  if (segment.minSpend) return `Spend ≥ ₹${Number(segment.minSpend).toLocaleString("en-IN")}`;
  if (segment.minOrders) return `${segment.minOrders}+ orders`;
  if (segment.role) return titleCase(segment.role);
  return "Custom segment";
}

function rate(value, sent) {
  if (value === undefined || value === null) return "—";
  if (!sent) return String(value);
  return `${((Number(value) / Number(sent)) * 100).toFixed(1)}%`;
}

function campaignTone(status) {
  if (status === "sent") return "success";
  if (status === "scheduled") return "amber";
  return "neutral";
}

export default function Marketing() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [savingId, setSavingId] = useState("");
  const [actionError, setActionError] = useState("");
  const query = useAsync(() => campaignsApi.list(), []);
  const campaigns = Array.isArray(query.data?.data) ? query.data.data : [];

  async function create(event) {
    event.preventDefault();
    setSavingId("new");
    setActionError("");
    const payload = {
      name: form.name.trim(),
      channel: form.channel,
      message: form.message.trim(),
      ...(form.channel === "email" && form.subject.trim() ? { subject: form.subject.trim() } : {}),
      ...(form.segment ? { segment: segmentPayload(form.segment) } : {}),
      ...(form.scheduledAt ? { scheduledAt: new Date(form.scheduledAt).toISOString() } : {}),
    };
    try {
      await campaignsApi.create(payload);
      await query.reload();
      setModal(false);
      setForm(EMPTY_FORM);
    } catch (error) {
      setActionError(error?.message || "Could not create the campaign.");
    } finally {
      setSavingId("");
    }
  }

  async function send(campaign) {
    const id = idOf(campaign);
    setSavingId(id);
    setActionError("");
    try {
      await campaignsApi.send(id);
      await query.reload();
    } catch (error) {
      setActionError(error?.message || "Could not send the campaign.");
    } finally {
      setSavingId("");
    }
  }

  async function remove(campaign) {
    if (!window.confirm(`Delete "${campaign.name}"?`)) return;
    const id = idOf(campaign);
    setSavingId(id);
    setActionError("");
    try {
      await campaignsApi.remove(id);
      await query.reload();
    } catch (error) {
      setActionError(error?.message || "Could not delete the campaign.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Marketing"
        description="Build email and SMS campaigns and track performance."
        action={<Button onClick={() => { setModal(true); setActionError(""); }}><Plus size={14} /> New campaign</Button>}
      />
      {actionError && <p className="text-sm text-danger mb-4">{actionError}</p>}
      <Card className="p-4">
        {query.loading ? (
          <LoadingState label="Loading campaigns…" />
        ) : query.error ? (
          <ErrorState message={query.error} onRetry={query.reload} />
        ) : (
          <Table
            columns={[
              {
                key: "name",
                label: "Campaign",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.channel === "email" ? <Mail size={14} className="text-muted" /> : <MessageSquare size={14} className="text-muted" />}
                    <div>
                      <div className="font-medium text-ink">{row.name}</div>
                      {row.scheduledAt && <div className="text-xs text-muted">{formatDateTime(row.scheduledAt)}</div>}
                    </div>
                  </div>
                ),
              },
              { key: "segment", label: "Audience", render: (row) => segmentLabel(row.segment) },
              { key: "sent", label: "Sent", render: (row) => row.stats?.sent ?? "—" },
              { key: "opened", label: "Open rate", render: (row) => rate(row.stats?.opened, row.stats?.sent) },
              { key: "clicked", label: "Click rate", render: (row) => rate(row.stats?.clicked, row.stats?.sent) },
              {
                key: "status",
                label: "Status",
                render: (row) => <Badge tone={campaignTone(row.status)}>{titleCase(row.status)}</Badge>,
              },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="flex justify-end gap-1">
                    {row.status !== "sent" && (
                      <Button size="sm" variant="secondary" onClick={() => send(row)} disabled={savingId === idOf(row)}>
                        <Send size={13} /> Send
                      </Button>
                    )}
                    <button
                      onClick={() => remove(row)}
                      disabled={savingId === idOf(row)}
                      className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger disabled:opacity-50"
                      aria-label="Delete campaign"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={campaigns.map((campaign) => ({ ...campaign, id: idOf(campaign) }))}
            empty="No campaigns yet."
          />
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="New campaign" width="max-w-xl">
        <form onSubmit={create}>
          <Field label="Campaign name">
            <input autoFocus className={inputCls} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Channel">
              <select className={inputCls} value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
                <option value="email">Email</option><option value="sms">SMS</option>
              </select>
            </Field>
            <Field label="Audience segment">
              <select className={inputCls} value={form.segment} onChange={(event) => setForm({ ...form, segment: event.target.value })}>
                <option value="">All users</option>
                <option value="customers">All customers</option>
                <option value="vip">VIP customers</option>
                <option value="repeat">Repeat customers</option>
              </select>
            </Field>
          </div>
          {form.channel === "email" && (
            <Field label="Email subject">
              <input className={inputCls} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </Field>
          )}
          <Field label="Message">
            <textarea className={inputCls} rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          </Field>
          <Field label="Schedule for (optional)">
            <input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" disabled={savingId === "new" || !form.name.trim() || !form.message.trim()}>
              Create campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
