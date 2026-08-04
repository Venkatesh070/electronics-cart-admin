import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MessageSquare, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { campaignsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDateTime, idOf, titleCase } from "../utils/format";
import {
  PageHeader,
  Card,
  Table,
  Badge,
  Button,
  LoadingState,
  ErrorState,
} from "../components/ui";

function segmentLabel(segment) {
  if (!segment || !Object.keys(segment).length) return "All users";
  if (segment.label) return segment.label;
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
  if (status === "sent" || status === "active") return "success";
  if (status === "scheduled") return "amber";
  return "neutral";
}

export default function Marketing() {
  const navigate = useNavigate();
  const [savingId, setSavingId] = useState("");
  const [actionError, setActionError] = useState("");
  const query = useAsync(() => campaignsApi.list(), []);
  const campaigns = Array.isArray(query.data?.data) ? query.data.data : [];

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
        eyebrow="Marketing"
        title="Campaigns"
        description="Build email, SMS and push campaigns and track performance."
        action={
          <Button onClick={() => navigate("/marketing/new")}>
            <Plus size={14} /> New campaign
          </Button>
        }
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
                    {row.channel === "sms" ? (
                      <MessageSquare size={14} className="text-muted" />
                    ) : (
                      <Mail size={14} className="text-muted" />
                    )}
                    <div>
                      <div className="font-medium text-ink">{row.name}</div>
                      <div className="text-xs text-muted">
                        {row.campaignType ? titleCase(row.campaignType) : ""}
                        {row.objective ? ` · ${titleCase(row.objective)}` : ""}
                        {row.scheduledAt || row.startsAt
                          ? ` · ${formatDateTime(row.startsAt || row.scheduledAt)}`
                          : ""}
                      </div>
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
                    <button
                      type="button"
                      onClick={() => navigate(`/marketing/${idOf(row)}/edit`)}
                      className="p-1.5 rounded hover:bg-bg text-muted"
                      aria-label="Edit campaign"
                    >
                      <Pencil size={14} />
                    </button>
                    {row.status !== "sent" && (
                      <Button size="sm" variant="secondary" onClick={() => send(row)} disabled={savingId === idOf(row)}>
                        <Send size={13} /> Send
                      </Button>
                    )}
                    <button
                      type="button"
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
    </div>
  );
}
