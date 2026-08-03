import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { giftCardsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, formatINR, idOf, nameOf, titleCase } from "../utils/format";
import { Badge, Button, Card, ErrorState, Field, inputCls, LoadingState, Modal, PageHeader, Table } from "../components/ui";

export default function GiftCards() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [cards, denominations] = await Promise.all([giftCardsApi.list(), giftCardsApi.denominations()]);
    return { cards: cards.data || [], denominations: denominations.data || [] };
  }, []);
  const [modal, setModal] = useState(false);
  const [lookup, setLookup] = useState("");
  const [form, setForm] = useState({ amount: "", issuedToEmail: "" });
  const [saving, setSaving] = useState(false);
  const cards = data?.cards || [];
  const denoms = (data?.denominations || []).map((d) => Number(typeof d === "object" ? d.amount ?? d.value : d)).filter(Boolean);
  const found = lookup ? cards.find((c) => c.code?.toLowerCase().includes(lookup.toLowerCase())) : null;

  function openIssue() { setForm({ amount: String(denoms[0] || ""), issuedToEmail: "" }); setModal(true); }
  async function issue() {
    setSaving(true);
    try { await giftCardsApi.issue({ amount: Number(form.amount), ...(form.issuedToEmail ? { issuedToEmail: form.issuedToEmail } : {}) }); await reload(); setModal(false); }
    catch (e) { alert(e?.message || "Could not issue gift card"); }
    finally { setSaving(false); }
  }
  async function voidCard(id) {
    if (!confirm("Void this gift card?")) return;
    try { await giftCardsApi.void(id); await reload(); } catch (e) { alert(e?.message || "Could not void gift card"); }
  }
  if (loading && !data) return <LoadingState label="Loading gift cards…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return <div>
    <PageHeader eyebrow="Sales" title="Gift Cards" description="Manage the gift card catalog, issued cards, and balances." action={<Button onClick={openIssue}><Plus size={14} /> Issue gift card</Button>} />
    <Card className="p-4 mb-4"><div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm"><Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" /><input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Look up balance by code…" className="pl-8 pr-3 py-2 text-sm border border-border rounded-md w-full" /></div>
      {found && <Badge tone="primary">Balance: {formatINR(found.balance)}</Badge>}{lookup && !found && <span className="text-xs text-muted">No card found</span>}
    </div></Card>
    <Card className="p-4 mb-4"><div className="text-xs font-medium text-muted mb-3">DENOMINATIONS</div><div className="flex gap-2 flex-wrap">{denoms.length ? denoms.map((d) => <Badge key={d}>{formatINR(d)}</Badge>) : <span className="text-sm text-muted">No denominations configured</span>}</div></Card>
    <Card className="p-4"><Table rows={cards} empty="No gift cards found." columns={[
      { key: "code", label: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
      { key: "initialBalance", label: "Value", render: (r) => formatINR(r.initialBalance) },
      { key: "balance", label: "Balance", render: (r) => <span className="font-mono">{formatINR(r.balance)}</span> },
      { key: "issuedTo", label: "Issued to", render: (r) => r.issuedToEmail || nameOf(r.issuedTo) },
      { key: "createdAt", label: "Issued on", render: (r) => <span className="font-mono text-xs">{formatDate(r.createdAt)}</span> },
      { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "active" ? "success" : "neutral"}>{titleCase(r.status)}</Badge> },
      { key: "void", label: "", render: (r) => r.status === "active" && <Button size="sm" variant="secondary" onClick={() => voidCard(idOf(r))}>Void</Button> },
    ]} /></Card>
    <Modal open={modal} onClose={() => setModal(false)} title="Issue gift card">
      <Field label="Denomination">{denoms.length ? <select className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}>{denoms.map((d) => <option key={d} value={d}>{formatINR(d)}</option>)}</select> : <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />}</Field>
      <Field label="Issue to (email, optional)"><input type="email" className={inputCls} value={form.issuedToEmail} onChange={(e) => setForm({ ...form, issuedToEmail: e.target.value })} placeholder="customer@example.com" /></Field>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={issue} disabled={saving || Number(form.amount) <= 0}>{saving ? "Issuing…" : "Issue card"}</Button></div>
    </Modal>
  </div>;
}
