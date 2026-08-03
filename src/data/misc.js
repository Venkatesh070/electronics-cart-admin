import { orders } from "./orders";
import { products } from "./products";
import { customers } from "./customers";

function seedRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const coupons = [
  { id: "CP1", code: "WELCOME500", type: "Flat", value: 500, minOrder: 5000, used: 342, limit: 1000, validTill: "2026-09-30", status: "Active", categories: "All" },
  { id: "CP2", code: "LAPTOP10", type: "Percent", value: 10, minOrder: 30000, used: 128, limit: 500, validTill: "2026-08-31", status: "Active", categories: "Laptops" },
  { id: "CP3", code: "GAMER15", type: "Percent", value: 15, minOrder: 80000, used: 64, limit: 200, validTill: "2026-08-15", status: "Active", categories: "Gaming Laptops" },
  { id: "CP4", code: "FESTIVE2025", type: "Flat", value: 2000, minOrder: 40000, used: 890, limit: 900, validTill: "2025-11-15", status: "Expired", categories: "All" },
  { id: "CP5", code: "ACCESS20", type: "Percent", value: 20, minOrder: 1500, used: 501, limit: 1500, validTill: "2026-10-01", status: "Active", categories: "Accessories" },
];

export const giftCards = [
  { id: "GC1", code: "GFT-8823-11A", denomination: 2000, balance: 2000, issuedTo: "arjun.rao@example.com", status: "Active", issued: "2026-07-01" },
  { id: "GC2", code: "GFT-4471-92B", denomination: 5000, balance: 1200, issuedTo: "priya.reddy@example.com", status: "Active", issued: "2026-06-14" },
  { id: "GC3", code: "GFT-1092-33C", denomination: 1000, balance: 0, issuedTo: "rohit.kumar@example.com", status: "Redeemed", issued: "2026-05-02" },
  { id: "GC4", code: "GFT-7734-45D", denomination: 10000, balance: 10000, issuedTo: "—", status: "Unissued", issued: "—" },
];

export const reviews = Array.from({ length: 14 }).map((_, i) => {
  const p = products[i % products.length];
  const c = customers[(i * 3) % customers.length];
  const r = seedRand(i + 1000);
  return {
    id: `RV${i + 1}`,
    productId: p.id,
    product: p.name,
    customer: c.name,
    rating: 1 + Math.floor(r * 5),
    title: r > 0.5 ? "Great value for money" : "Not what I expected",
    text: r > 0.5 ? "Performance is solid for daily use and the build quality feels premium." : "Battery drains faster than advertised, otherwise okay.",
    flagged: r > 0.85,
    status: r > 0.85 ? "Pending" : r > 0.5 ? "Approved" : "Pending",
    date: `2026-0${1 + Math.floor(r * 7)}-1${i % 9}`,
  };
});

export const returns = Array.from({ length: 9 }).map((_, i) => {
  const o = orders[(i * 4) % orders.length];
  const reasons = ["Item defective", "Wrong item received", "No longer needed", "Better price found elsewhere", "Damaged in transit"];
  const status = ["Requested", "Pickup Scheduled", "Inspecting", "Refunded", "Rejected"][i % 5];
  return {
    id: `RTN-${5000 + i}`,
    orderId: o.id,
    customer: o.customer,
    item: o.items[0].name,
    reason: reasons[i % reasons.length],
    type: i % 2 === 0 ? "Refund" : "Replacement",
    status,
    amount: o.amount,
    date: o.date,
  };
});

export const adminUsers = [
  { id: "U1", name: "Manjunadh", email: "manju@electronicscart.in", role: "Super Admin", status: "Active", lastActive: "2026-08-03" },
  { id: "U2", name: "Anandu Krishna", email: "anandu@electronicscart.in", role: "Manager", status: "Active", lastActive: "2026-08-02" },
  { id: "U3", name: "Sindhu Rao", email: "sindhu@electronicscart.in", role: "Support", status: "Active", lastActive: "2026-08-03" },
  { id: "U4", name: "Farhan Ali", email: "farhan@electronicscart.in", role: "Catalog Manager", status: "Invited", lastActive: "—" },
  { id: "U5", name: "Deepika N.", email: "deepika@electronicscart.in", role: "Support", status: "Suspended", lastActive: "2026-07-20" },
];

export const auditLogs = Array.from({ length: 16 }).map((_, i) => {
  const actions = ["Updated product price", "Approved return", "Blocked customer", "Created coupon", "Changed order status", "Edited category", "Issued gift card", "Updated shipping zone"];
  const u = adminUsers[i % adminUsers.length];
  return {
    id: `LOG${i + 1}`,
    user: u.name,
    action: actions[i % actions.length],
    module: ["Products", "Returns", "Customers", "Coupons", "Orders", "Categories", "Gift Cards", "Shipping"][i % 8],
    date: `2026-08-0${1 + (i % 3)} ${9 + (i % 10)}:${(i * 7) % 60 < 10 ? "0" : ""}${(i * 7) % 60}`,
  };
});

export const banners = [
  { id: "BN1", title: "Independence Day Sale", placement: "Homepage Hero", start: "2026-08-08", end: "2026-08-16", priority: 1, status: "Scheduled" },
  { id: "BN2", title: "MacBook Air — New Arrival", placement: "Homepage Hero", start: "2026-07-20", end: "2026-08-05", priority: 2, status: "Live" },
  { id: "BN3", title: "Gaming Laptops Category Top", placement: "Category — Gaming Laptops", start: "2026-07-01", end: "2026-09-01", priority: 1, status: "Live" },
  { id: "BN4", title: "Monsoon Clearance", placement: "Homepage Hero", start: "2026-06-01", end: "2026-07-01", priority: 3, status: "Expired" },
];

export const flashSales = [
  { id: "FS1", name: "Weekend Laptop Blast", products: 12, discount: "Up to 25%", stockCap: 150, sold: 96, start: "2026-08-01 00:00", end: "2026-08-03 23:59", status: "Live" },
  { id: "FS2", name: "Accessories Flash", products: 30, discount: "Flat 30%", stockCap: 400, sold: 118, start: "2026-08-05 00:00", end: "2026-08-06 23:59", status: "Scheduled" },
  { id: "FS3", name: "Clearance — Refurbished", products: 8, discount: "Up to 40%", stockCap: 60, sold: 60, start: "2026-07-20 00:00", end: "2026-07-22 23:59", status: "Ended" },
];
