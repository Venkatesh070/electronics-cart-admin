import { useState } from "react";
import { FileText, Save, Plus } from "lucide-react";
import { PageHeader, Card, Tabs, Button, Field, inputCls, Badge } from "../components/ui";

const pages = [
  { id: "about", name: "About Us", updated: "2026-07-12" },
  { id: "returns-policy", name: "Return Policy", updated: "2026-06-28" },
  { id: "shipping-policy", name: "Shipping Policy", updated: "2026-06-28" },
  { id: "terms", name: "Terms & Conditions", updated: "2026-05-02" },
  { id: "privacy", name: "Privacy Policy", updated: "2026-05-02" },
];

const posts = [
  { id: "1", title: "Best laptops under ₹60,000 in 2026", category: "Buying Guides", status: "Published" },
  { id: "2", title: "Intel vs AMD: which CPU should you pick?", category: "Comparisons", status: "Published" },
  { id: "3", title: "New arrivals: August laptop lineup", category: "News", status: "Draft" },
];

export default function CMS() {
  const [tab, setTab] = useState("Static pages");
  const [selected, setSelected] = useState(pages[0]);
  const [blocks, setBlocks] = useState([
    { id: 1, name: "Hero carousel", enabled: true },
    { id: 2, name: "Shop by category", enabled: true },
    { id: 3, name: "Deal of the day", enabled: true },
    { id: 4, name: "Trending products", enabled: true },
    { id: 5, name: "Brand strip", enabled: false },
    { id: 6, name: "Newsletter signup", enabled: true },
  ]);

  return (
    <div>
      <PageHeader eyebrow="Content" title="CMS" description="Manage static pages, blog posts, and homepage content blocks." />
      <Tabs tabs={["Static pages", "Blog", "Homepage blocks"]} active={tab} onChange={setTab} />

      {tab === "Static pages" && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-2 col-span-1 h-fit">
            {pages.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)} className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-md text-sm ${selected.id === p.id ? "bg-primary-light text-primary-dark font-medium" : "hover:bg-bg text-ink"}`}>
                <FileText size={14} /> {p.name}
              </button>
            ))}
          </Card>
          <Card className="p-5 col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">{selected.name}</h3>
              <span className="text-xs text-muted">Last updated {selected.updated}</span>
            </div>
            <Field label="Page title"><input className={inputCls} defaultValue={selected.name} /></Field>
            <Field label="Content"><textarea className={inputCls} rows={10} defaultValue={`Write the ${selected.name} content here…`} /></Field>
            <Button variant="primary"><Save size={14} /> Save page</Button>
          </Card>
        </div>
      )}

      {tab === "Blog" && (
        <Card className="p-4">
          <div className="flex justify-end mb-3"><Button variant="primary" size="sm"><Plus size={13} /> New post</Button></div>
          <div className="flex flex-col divide-y divide-border">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div><div className="font-medium text-sm">{p.title}</div><div className="text-xs text-muted">{p.category}</div></div>
                <Badge tone={p.status === "Published" ? "success" : "amber"}>{p.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Homepage blocks" && (
        <Card className="p-4">
          <div className="flex flex-col divide-y divide-border">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">{b.name}</span>
                <button
                  onClick={() => setBlocks(blocks.map((x) => x.id === b.id ? { ...x, enabled: !x.enabled } : x))}
                  className={`w-9 h-5 rounded-full transition-colors relative ${b.enabled ? "bg-primary" : "bg-border"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${b.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
