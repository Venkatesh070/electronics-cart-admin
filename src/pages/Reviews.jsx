import { useState } from "react";
import { Star, Flag, Check, X } from "lucide-react";
import { PageHeader, Card, Select, Badge, Button } from "../components/ui";
import { reviews as seed } from "../data/misc";

export default function Reviews() {
  const [reviews, setReviews] = useState(seed);
  const [filter, setFilter] = useState("Pending");

  const rows = reviews.filter((r) => filter === "All" || r.status === filter || (filter === "Flagged" && r.flagged));

  function setStatus(id, status) { setReviews(reviews.map((r) => r.id === id ? { ...r, status, flagged: false } : r)); }

  return (
    <div>
      <PageHeader eyebrow="Customers" title="Reviews" description="Moderate product reviews before they go live on the storefront." />
      <div className="flex items-center gap-2 mb-4">
        <Select value={filter} onChange={setFilter} options={["Pending", "Approved", "Flagged", "All"]} />
        <span className="text-xs text-muted">{rows.length} reviews</span>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex text-amber">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill={i < r.rating ? "currentColor" : "none"} className={i < r.rating ? "" : "text-border"} />)}
                  </div>
                  {r.flagged && <Badge tone="danger"><Flag size={10} className="mr-1 inline" />Flagged</Badge>}
                  <Badge tone={r.status === "Approved" ? "success" : "amber"}>{r.status}</Badge>
                </div>
                <div className="font-medium text-ink text-sm">{r.title}</div>
                <p className="text-sm text-muted mt-0.5">{r.text}</p>
                <div className="text-xs text-muted mt-2">{r.customer} · on <span className="text-ink">{r.product}</span> · {r.date}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "Rejected")}><X size={13} /> Reject</Button>
                <Button size="sm" variant="primary" onClick={() => setStatus(r.id, "Approved")}><Check size={13} /> Approve</Button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted text-center py-10">Nothing to moderate here.</p>}
      </div>
    </div>
  );
}
