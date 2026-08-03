const MAP = {
  // green
  Active: "bg-success", ACTIVE: "bg-success", Published: "bg-success", published: "bg-success", Delivered: "bg-success", delivered: "bg-success",
  Live: "bg-success", Approved: "bg-success", approved: "bg-success", Refunded: "bg-success", refunded: "bg-success",
  Confirmed: "bg-success", confirmed: "bg-success", paid: "bg-success",
  // amber
  Pending: "bg-amber", pending: "bg-amber", Draft: "bg-amber", draft: "bg-amber", DRAFT: "bg-amber", "Pickup Scheduled": "bg-amber",
  Scheduled: "bg-amber", Inspecting: "bg-amber", inspected: "bg-amber", Placed: "bg-amber",
  Shipped: "bg-amber", shipped: "bg-amber", "Out for Delivery": "bg-amber", out_for_delivery: "bg-amber",
  Invited: "bg-amber", Requested: "bg-amber", requested: "bg-amber", picked_up: "bg-amber",
  // red
  Blocked: "bg-danger", "Out of Stock": "bg-danger", Cancelled: "bg-danger", cancelled: "bg-danger",
  Rejected: "bg-danger", rejected: "bg-danger", Expired: "bg-danger", Suspended: "bg-danger", flagged: "bg-danger",
  // neutral
  Archived: "bg-gray-400", archived: "bg-gray-400", INACTIVE: "bg-gray-400", Ended: "bg-gray-400", Redeemed: "bg-gray-400",
  Unissued: "bg-gray-300", void: "bg-gray-400",
};

export default function StatusDot({ status, label }) {
  const color = MAP[status] || "bg-gray-400";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink">
      <span className={`led ${color}`} />
      {label ?? status}
    </span>
  );
}
