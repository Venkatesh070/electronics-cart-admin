const MAP = {
  // green
  Active: "bg-success", Published: "bg-success", Delivered: "bg-success",
  Live: "bg-success", Approved: "bg-success", Refunded: "bg-success",
  Confirmed: "bg-success",
  // amber
  Pending: "bg-amber", Draft: "bg-amber", "Pickup Scheduled": "bg-amber",
  Scheduled: "bg-amber", Inspecting: "bg-amber", Placed: "bg-amber",
  Shipped: "bg-amber", "Out for Delivery": "bg-amber", Invited: "bg-amber",
  Requested: "bg-amber",
  // red
  Blocked: "bg-danger", "Out of Stock": "bg-danger", Cancelled: "bg-danger",
  Rejected: "bg-danger", Expired: "bg-danger", Suspended: "bg-danger",
  // neutral
  Archived: "bg-gray-400", Ended: "bg-gray-400", Redeemed: "bg-gray-400",
  Unissued: "bg-gray-300",
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
