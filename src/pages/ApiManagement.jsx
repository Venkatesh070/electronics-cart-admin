import { useState } from "react";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { apiKeysApi, webhooksApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDateTime, idOf } from "../utils/format";
import { PageHeader, Card, Button, Table, Badge, Modal, Field, inputCls, LoadingState, ErrorState, Tabs } from "../components/ui";

export default function ApiManagement() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [keys, webhooks] = await Promise.all([apiKeysApi.list(), webhooksApi.list()]);
    return { keys: keys.data || [], webhooks: webhooks.data || [] };
  }, []);
  const [tab, setTab] = useState("API keys");
  const [keyOpen, setKeyOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [plaintextKey, setPlaintextKey] = useState("");
  const [keyForm, setKeyForm] = useState({ name: "", scopes: "", rateLimitPerMinute: "60" });
  const [webhookForm, setWebhookForm] = useState({ url: "", events: "" });
  const [saving, setSaving] = useState(false);

  async function createKey(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await apiKeysApi.create({ name: keyForm.name.trim(), scopes: keyForm.scopes.split(",").map((value) => value.trim()).filter(Boolean), rateLimitPerMinute: Number(keyForm.rateLimitPerMinute) });
      setKeyOpen(false);
      setPlaintextKey(response.data?.plaintextKey || "");
      setKeyForm({ name: "", scopes: "", rateLimitPerMinute: "60" });
      await reload();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function revoke(key) {
    if (!window.confirm(`Revoke ${key.name}? This cannot be undone.`)) return;
    try {
      await apiKeysApi.revoke(idOf(key));
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function createWebhook(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await webhooksApi.create({ url: webhookForm.url.trim(), events: webhookForm.events.split(",").map((value) => value.trim()).filter(Boolean) });
      setWebhookOpen(false);
      setWebhookForm({ url: "", events: "" });
      await reload();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeWebhook(webhook) {
    if (!window.confirm(`Delete webhook ${webhook.url}?`)) return;
    try {
      await webhooksApi.remove(idOf(webhook));
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  if (loading) return <LoadingState label="Loading API management…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader eyebrow="Developers" title="API management" description="Manage API credentials and webhook subscriptions." action={<Button onClick={() => tab === "API keys" ? setKeyOpen(true) : setWebhookOpen(true)}><Plus size={14} /> {tab === "API keys" ? "Create key" : "Add webhook"}</Button>} />
      <Tabs tabs={["API keys", "Webhooks"]} active={tab} onChange={setTab} />
      <Card className="p-4">
        {tab === "API keys" ? <Table rows={data?.keys || []} columns={[
          { key: "name", label: "Name" },
          { key: "keyPrefix", label: "Key", render: (r) => <span className="font-mono text-xs">{r.keyPrefix}••••••••</span> },
          { key: "scopes", label: "Scopes", render: (r) => (r.scopes || []).join(", ") || "None" },
          { key: "rateLimitPerMinute", label: "Rate limit", render: (r) => `${r.rateLimitPerMinute}/min` },
          { key: "lastUsedAt", label: "Last used", render: (r) => formatDateTime(r.lastUsedAt) },
          { key: "revoked", label: "Status", render: (r) => <Badge tone={r.revoked ? "danger" : "success"}>{r.revoked ? "Revoked" : "Active"}</Badge> },
          { key: "action", label: "", render: (r) => !r.revoked && <Button size="sm" variant="danger" onClick={() => revoke(r)}>Revoke</Button> },
        ]} /> : <Table rows={data?.webhooks || []} columns={[
          { key: "url", label: "Endpoint" },
          { key: "events", label: "Events", render: (r) => (r.events || []).join(", ") },
          { key: "active", label: "Status", render: (r) => <Badge tone={r.active === false ? "neutral" : "success"}>{r.active === false ? "Inactive" : "Active"}</Badge> },
          { key: "createdAt", label: "Created", render: (r) => formatDateTime(r.createdAt) },
          { key: "action", label: "", render: (r) => <button className="p-1.5 text-muted hover:text-danger" onClick={() => removeWebhook(r)}><Trash2 size={14} /></button> },
        ]} />}
      </Card>
      <Modal open={keyOpen} onClose={() => setKeyOpen(false)} title="Create API key">
        <form onSubmit={createKey}>
          <Field label="Name"><input required className={inputCls} value={keyForm.name} onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })} /></Field>
          <Field label="Scopes (comma-separated)"><input className={inputCls} value={keyForm.scopes} onChange={(e) => setKeyForm({ ...keyForm, scopes: e.target.value })} /></Field>
          <Field label="Rate limit per minute"><input required min="1" type="number" className={inputCls} value={keyForm.rateLimitPerMinute} onChange={(e) => setKeyForm({ ...keyForm, rateLimitPerMinute: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setKeyOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}><KeyRound size={14} /> Create key</Button></div>
        </form>
      </Modal>
      <Modal open={webhookOpen} onClose={() => setWebhookOpen(false)} title="Add webhook">
        <form onSubmit={createWebhook}>
          <Field label="Endpoint URL"><input required type="url" className={inputCls} value={webhookForm.url} onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })} /></Field>
          <Field label="Events (comma-separated)"><input required className={inputCls} value={webhookForm.events} onChange={(e) => setWebhookForm({ ...webhookForm, events: e.target.value })} placeholder="order.created, order.updated" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setWebhookOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>Create webhook</Button></div>
        </form>
      </Modal>
      <Modal open={Boolean(plaintextKey)} onClose={() => setPlaintextKey("")} title="Save your API key now">
        <p className="text-sm text-muted mb-3">This plaintext key is shown only once. Store it securely.</p>
        <div className="flex gap-2"><code className="flex-1 break-all bg-bg border border-border rounded-md p-3 text-xs">{plaintextKey}</code><Button variant="secondary" onClick={() => navigator.clipboard.writeText(plaintextKey)}><Copy size={14} /> Copy</Button></div>
        <div className="flex justify-end mt-5"><Button onClick={() => setPlaintextKey("")}>I saved it</Button></div>
      </Modal>
    </div>
  );
}
