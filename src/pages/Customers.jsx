import { useState } from "react";
import { Lock, MessageSquarePlus, Unlock } from "lucide-react";
import { customersApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, formatDateTime, formatINR, idOf, titleCase } from "../utils/format";
import {
  PageHeader,
  Card,
  Button,
  Table,
  Badge,
  SearchInput,
  Select,
  Drawer,
  LoadingState,
  ErrorState,
  EmptyState,
  inputCls,
} from "../components/ui";
import StatusDot from "../components/StatusDot";

function segmentOf(customer) {
  if (Number(customer.totalSpend) > 50000) return "VIP";
  if (Number(customer.orderCount) > 0) return "Regular";
  return "New";
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("All");
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const customersQuery = useAsync(() => customersApi.list({ search: search.trim(), limit: 50 }), [search]);
  const profileQuery = useAsync(
    () => selectedId ? customersApi.get(selectedId) : Promise.resolve({ success: true, data: null }),
    [selectedId]
  );

  const customers = Array.isArray(customersQuery.data?.data) ? customersQuery.data.data : [];
  const rows = customers
    .map((customer) => ({
      ...customer,
      id: idOf(customer),
      segment: segmentOf(customer),
      status: customer.isBlocked ? "Blocked" : "Active",
    }))
    .filter((customer) => segment === "All" || customer.segment === segment);

  const profile = profileQuery.data?.data;
  const customer = profile?.customer;
  const orders = Array.isArray(profile?.orders) ? profile.orders : [];
  const addresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
  const tickets = Array.isArray(profile?.tickets) ? profile.tickets : [];

  async function toggleBlock() {
    if (!customer) return;
    setSaving(true);
    setActionError("");
    try {
      await customersApi.block(idOf(customer), !customer.isBlocked);
      await Promise.all([customersQuery.reload(), profileQuery.reload()]);
    } catch (error) {
      setActionError(error?.message || "Could not update this customer.");
    } finally {
      setSaving(false);
    }
  }

  async function addNote(event) {
    event.preventDefault();
    if (!customer || !note.trim()) return;
    setSaving(true);
    setActionError("");
    try {
      await customersApi.addNote(idOf(customer), note.trim());
      setNote("");
      await profileQuery.reload();
    } catch (error) {
      setActionError(error?.message || "Could not add the note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title="Customers"
        description={`${customers.length} customers loaded. Search, segment, and manage accounts.`}
      />
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
          <Select value={segment} onChange={setSegment} options={["All", "VIP", "Regular", "New"]} />
        </div>
        {customersQuery.loading ? (
          <LoadingState label="Loading customers…" />
        ) : customersQuery.error ? (
          <ErrorState message={customersQuery.error} onRetry={customersQuery.reload} />
        ) : (
          <Table
            columns={[
              {
                key: "name",
                label: "Customer",
                render: (row) => (
                  <div>
                    <div className="font-medium text-ink">{row.name || "Unnamed customer"}</div>
                    <div className="text-xs text-muted">{row.email || "—"}</div>
                  </div>
                ),
              },
              { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
              { key: "orderCount", label: "Orders", render: (row) => Number(row.orderCount) || 0 },
              { key: "totalSpend", label: "Total spend", render: (row) => formatINR(row.totalSpend) },
              {
                key: "segment",
                label: "Segment",
                render: (row) => (
                  <Badge tone={row.segment === "VIP" ? "primary" : row.segment === "Regular" ? "success" : "neutral"}>
                    {row.segment}
                  </Badge>
                ),
              },
              { key: "status", label: "Status", render: (row) => <StatusDot status={row.status} /> },
            ]}
            rows={rows}
            onRowClick={(row) => setSelectedId(row.id)}
            empty="No customers match these filters."
          />
        )}
      </Card>

      <Drawer open={!!selectedId} onClose={() => setSelectedId("")} title={customer?.name || "Customer profile"}>
        {profileQuery.loading ? (
          <LoadingState label="Loading customer profile…" />
        ) : profileQuery.error ? (
          <ErrorState message={profileQuery.error} onRetry={profileQuery.reload} />
        ) : customer ? (
          <div className="space-y-6">
            <div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><div className="text-xs text-muted">Email</div>{customer.email || "—"}</div>
                <div><div className="text-xs text-muted">Phone</div>{customer.phone || "—"}</div>
                <div><div className="text-xs text-muted">Joined</div>{formatDate(customer.createdAt)}</div>
                <div><div className="text-xs text-muted">Status</div><StatusDot status={customer.isBlocked ? "Blocked" : "Active"} /></div>
              </div>
              {actionError && <p className="text-sm text-danger mb-3">{actionError}</p>}
              <Button
                variant={customer.isBlocked ? "primary" : "danger"}
                size="sm"
                onClick={toggleBlock}
                disabled={saving}
              >
                {customer.isBlocked ? <><Unlock size={13} /> Unblock account</> : <><Lock size={13} /> Block account</>}
              </Button>
            </div>

            <section>
              <div className="text-xs font-medium text-muted mb-2">ORDER HISTORY</div>
              <div className="flex flex-col gap-2">
                {orders.map((order) => (
                  <div key={idOf(order)} className="flex justify-between items-center border border-border rounded-md px-3 py-2 text-sm">
                    <div>
                      <div className="font-mono text-xs">{idOf(order)}</div>
                      <div className="text-xs text-muted">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{formatINR(order.totalAmount)}</div>
                      <Badge tone="neutral">{titleCase(order.status)}</Badge>
                    </div>
                  </div>
                ))}
                {!orders.length && <p className="text-sm text-muted">No orders yet.</p>}
              </div>
            </section>

            <section>
              <div className="text-xs font-medium text-muted mb-2">ADDRESSES</div>
              {addresses.length ? (
                <div className="grid gap-2">
                  {addresses.map((address) => (
                    <div key={idOf(address)} className="border border-border rounded-md px-3 py-2 text-sm text-muted">
                      <div className="font-medium text-ink">{address.name || address.label || "Address"}</div>
                      {[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted">No saved addresses.</p>}
            </section>

            <section>
              <div className="text-xs font-medium text-muted mb-2">SUPPORT TICKETS</div>
              {tickets.length ? (
                <div className="grid gap-2">
                  {tickets.map((ticket) => (
                    <div key={idOf(ticket)} className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium text-ink">{ticket.subject || "Support ticket"}</div>
                        <div className="text-xs text-muted">{formatDateTime(ticket.updatedAt)}</div>
                      </div>
                      <Badge tone="neutral">{titleCase(ticket.status)}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted">No support tickets.</p>}
            </section>

            <form onSubmit={addNote}>
              <div className="text-xs font-medium text-muted mb-2">ADMIN NOTE</div>
              <textarea
                className={inputCls}
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add an internal note…"
              />
              <Button className="mt-2" size="sm" type="submit" disabled={saving || !note.trim()}>
                <MessageSquarePlus size={13} /> Add note
              </Button>
            </form>
          </div>
        ) : (
          <EmptyState title="Customer not found" description="This customer profile is no longer available." />
        )}
      </Drawer>
    </div>
  );
}
