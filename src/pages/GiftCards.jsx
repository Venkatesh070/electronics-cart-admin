import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader, Card, Table, Badge, Button, Modal, Field, inputCls } from "../components/ui";
import { giftCards as seed } from "../data/misc";

const denoms = [500, 1000, 2000, 5000, 10000];

export default function GiftCards() {
  const [cards, setCards] = useState(seed);
  const [modal, setModal] = useState(false);
  const [lookup, setLookup] = useState("");
  const [form, setForm] = useState({ denomination: 1000, issuedTo: "" });

  function issue() {
    setCards([{ id: `GC${Date.now()}`, code: `GFT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`, denomination: Number(form.denomination), balance: Number(form.denomination), issuedTo: form.issuedTo || "—", status: form.issuedTo ? "Active" : "Unissued", issued: form.issuedTo ? "2026-08-03" : "—" }, ...cards]);
    setModal(false);
    setForm({ denomination: 1000, issuedTo: "" });
  }

  const found = lookup ? cards.find((c) => c.code.toLowerCase().includes(lookup.toLowerCase())) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Sales" title="Gift Cards"
        description="Manage the gift card catalog, issued cards, and balances."
        action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Issue gift card</Button>}
      />

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Look up balance by code…" className="pl-8 pr-3 py-2 text-sm border border-border rounded-md w-full" />
          </div>
          {found && <Badge tone="primary">Balance: ₹{found.balance.toLocaleString("en-IN")}</Badge>}
          {lookup && !found && <span className="text-xs text-muted">No card found</span>}
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <div className="text-xs font-medium text-muted mb-3">DENOMINATIONS</div>
        <div className="flex gap-2 flex-wrap">
          {denoms.map((d) => <Badge key={d} tone="neutral">₹{d.toLocaleString("en-IN")}</Badge>)}
        </div>
      </Card>

      <Card className="p-4">
        <Table
          columns={[
            { key: "code", label: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
            { key: "denomination", label: "Value", render: (r) => `₹${r.denomination.toLocaleString("en-IN")}` },
            { key: "balance", label: "Balance", render: (r) => <span className="font-mono">₹{r.balance.toLocaleString("en-IN")}</span> },
            { key: "issuedTo", label: "Issued to" },
            { key: "issued", label: "Issued on", render: (r) => <span className="font-mono text-xs">{r.issued}</span> },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Active" ? "success" : r.status === "Redeemed" ? "neutral" : "amber"}>{r.status}</Badge> },
            { key: "void", label: "", render: (r) => r.status === "Active" && (
                <Button size="sm" variant="secondary" onClick={() => setCards(cards.map((c) => c.id === r.id ? { ...c, status: "Redeemed", balance: 0 } : c))}>Void</Button>
              ) },
          ]}
          rows={cards}
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Issue gift card">
        <Field label="Denomination">
          <select className={inputCls} value={form.denomination} onChange={(e) => setForm({ ...form, denomination: e.target.value })}>
            {denoms.map((d) => <option key={d} value={d}>₹{d.toLocaleString("en-IN")}</option>)}
          </select>
        </Field>
        <Field label="Issue to (email, optional)"><input className={inputCls} value={form.issuedTo} onChange={(e) => setForm({ ...form, issuedTo: e.target.value })} placeholder="customer@example.com" /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={issue}>Issue card</Button>
        </div>
      </Modal>
    </div>
  );
}
