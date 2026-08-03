import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { PageHeader, Card, Table, Badge, SearchInput, Select, useSearchFilter, Drawer, Button } from "../components/ui";
import { customers as seed } from "../data/customers";
import { orders } from "../data/orders";

export default function Customers() {
  const [customers, setCustomers] = useState(seed);
  const [filtered, q, setQ] = useSearchFilter(customers, ["name", "email", "phone"]);
  const [segment, setSegment] = useState("All");
  const [active, setActive] = useState(null);

  const rows = filtered.filter((c) => segment === "All" || c.segment === segment);

  function toggleBlock(id) {
    setCustomers(customers.map((c) => c.id === id ? { ...c, status: c.status === "Active" ? "Blocked" : "Active" } : c));
    setActive((a) => a && a.id === id ? { ...a, status: a.status === "Active" ? "Blocked" : "Active" } : a);
  }

  const customerOrders = active ? orders.filter((o) => o.customerId === active.id) : [];

  return (
    <div>
      <PageHeader eyebrow="Customers" title="Customers" description={`${customers.length} customers. Search, segment, and manage accounts.`} />
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search name, email, phone…" />
          <Select value={segment} onChange={setSegment} options={["All", "VIP", "Regular", "New"]} />
        </div>
        <Table
          columns={[
            { key: "name", label: "Customer", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted">{r.email}</div></div> },
            { key: "city", label: "City" },
            { key: "orders", label: "Orders" },
            { key: "spend", label: "Total spend", render: (r) => `₹${r.spend.toLocaleString("en-IN")}` },
            { key: "segment", label: "Segment", render: (r) => <Badge tone={r.segment === "VIP" ? "primary" : r.segment === "Regular" ? "success" : "neutral"}>{r.segment}</Badge> },
            { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Active" ? "success" : "danger"}>{r.status}</Badge> },
          ]}
          rows={rows}
          onRowClick={setActive}
        />
      </Card>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name}>
        {active && (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div><div className="text-xs text-muted">Email</div>{active.email}</div>
              <div><div className="text-xs text-muted">Phone</div>{active.phone}</div>
              <div><div className="text-xs text-muted">City</div>{active.city}</div>
              <div><div className="text-xs text-muted">Joined</div><div className="font-mono">{active.joined}</div></div>
              <div><div className="text-xs text-muted">Total orders</div>{active.orders}</div>
              <div><div className="text-xs text-muted">Total spend</div>₹{active.spend.toLocaleString("en-IN")}</div>
            </div>
            <Button variant={active.status === "Active" ? "danger" : "primary"} size="sm" onClick={() => toggleBlock(active.id)} className="mb-5">
              {active.status === "Active" ? <><Lock size={13} /> Block account</> : <><Unlock size={13} /> Unblock account</>}
            </Button>
            <div className="text-xs font-medium text-muted mb-2">ORDER HISTORY</div>
            <div className="flex flex-col gap-2">
              {customerOrders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
              {customerOrders.map((o) => (
                <div key={o.id} className="flex justify-between items-center border border-border rounded-md px-3 py-2 text-sm">
                  <div><div className="font-mono text-xs">{o.id}</div><div className="text-xs text-muted">{o.date}</div></div>
                  <div className="text-right"><div className="font-mono">₹{o.amount.toLocaleString("en-IN")}</div><Badge tone="neutral">{o.status}</Badge></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
