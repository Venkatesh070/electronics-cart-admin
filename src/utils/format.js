/** Resolve stored media paths like `/uploads/...` for <img src>. */
export function mediaUrl(path) {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export function formatINR(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatINRCompact(value) {
  const n = Number(value) || 0;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return formatINR(n);
}

export function titleCase(value = "") {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function idOf(doc) {
  return doc?._id || doc?.id || "";
}

export function nameOf(ref, fallback = "—") {
  if (!ref) return fallback;
  if (typeof ref === "string") return ref;
  return ref.name || ref.email || fallback;
}

export function initials(name = "") {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "?";
}

export function downloadCsv(filename, rows) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ORDER_STATUS_LABEL = {
  pending: "Placed",
  confirmed: "Confirmed",
  paid: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_API = {
  Placed: "pending",
  Confirmed: "confirmed",
  Shipped: "shipped",
  "Out for Delivery": "out_for_delivery",
  Delivered: "delivered",
  Cancelled: "cancelled",
};
