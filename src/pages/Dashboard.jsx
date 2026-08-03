import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from "recharts";
import { IndianRupee, ShoppingCart, Users, PackageCheck, PackagePlus, Boxes, AlertTriangle, Plus } from "lucide-react";
import { PageHeader, Card, KPICard, Button, Table, Badge } from "../components/ui";
import StatusDot from "../components/StatusDot";
import { orders } from "../data/orders";
import { products } from "../data/products";
import { customers } from "../data/customers";
import { brands } from "../data/brands";
import { auditLogs } from "../data/misc";

const revenueTrend = [
  { d: "Jul 28", rev: 412000, orders: 18 },
  { d: "Jul 29", rev: 389000, orders: 15 },
  { d: "Jul 30", rev: 521000, orders: 22 },
  { d: "Jul 31", rev: 468000, orders: 19 },
  { d: "Aug 1", rev: 604000, orders: 27 },
  { d: "Aug 2", rev: 573000, orders: 24 },
  { d: "Aug 3", rev: 349000, orders: 14 },
];

const statusCounts = orders.reduce((acc, o) => {
  acc[o.status] = (acc[o.status] || 0) + 1;
  return acc;
}, {});
const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
const STATUS_COLORS = { Placed: "#FF8A3D", Confirmed: "#3654FF", Shipped: "#8B9DFF", "Out for Delivery": "#FFC08A", Delivered: "#16A34A", Cancelled: "#E5484D" };

const brandSales = brands.slice(0, 6).map((b, i) => ({ name: b.name, units: b.productCount * (3 + (i % 4)) }));

const lowStock = products.filter((p) => p.stock <= 6).slice(0, 5);
const recentOrders = orders.slice(0, 6);

export default function Dashboard() {
  const totalRevenue = orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + o.amount, 0);
  const aov = Math.round(totalRevenue / orders.filter(o => o.status !== "Cancelled").length);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Good afternoon, Manjunadh"
        description="Here's how Electronics Cart is performing today."
        action={
          <div className="flex gap-2">
            <Button variant="secondary"><Plus size={14} /> Create order</Button>
            <Button variant="primary"><Plus size={14} /> Add product</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KPICard label="Revenue (7d)" value={`₹${(totalRevenue / 100000).toFixed(1)}L`} sub="+12.4% vs last week" icon={IndianRupee} />
        <KPICard label="Orders (7d)" value={orders.length} sub="+8 vs last week" icon={ShoppingCart} />
        <KPICard label="Avg order value" value={`₹${aov.toLocaleString("en-IN")}`} sub="+3.1%" icon={PackageCheck} />
        <KPICard label="New customers" value="14" sub="+5 this week" icon={Users} />
        <KPICard label="Products sold" value="86" sub="+19 units" icon={PackagePlus} />
        <KPICard label="Low stock alerts" value={lowStock.length} sub="Needs attention" subTone="danger" icon={Boxes} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-ink">Revenue &amp; orders trend</h3>
            <span className="text-xs text-muted font-mono">LAST 7 DAYS</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3654FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3654FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4E7EC" }} />
              <Area type="monotone" dataKey="rev" stroke="#3654FF" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-ink">Orders by status</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={2}>
                {statusData.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.name] || "#D8DCE3"} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4E7EC" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="led" style={{ background: STATUS_COLORS[s.name] }} />
                {s.name} <span className="text-ink font-medium ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 xl:col-span-2">
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Sales by brand</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={brandSales} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4E7EC" }} />
              <Bar dataKey="units" fill="#3654FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber" />
            <h3 className="font-display font-semibold text-sm text-ink">Low stock alerts</h3>
          </div>
          <div className="flex flex-col gap-3">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="text-ink font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted font-mono">{p.sku}</div>
                </div>
                <Badge tone={p.stock === 0 ? "danger" : "amber"}>{p.stock} left</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold text-sm text-ink">Recent orders</h3>
            <a href="/orders" className="text-xs text-primary font-medium">View all →</a>
          </div>
          <Table
            columns={[
              { key: "id", label: "Order", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
              { key: "customer", label: "Customer" },
              { key: "amount", label: "Amount", render: (r) => `₹${r.amount.toLocaleString("en-IN")}` },
              { key: "status", label: "Status", render: (r) => <StatusDot status={r.status} /> },
            ]}
            rows={recentOrders}
          />
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Recent activity</h3>
          <div className="flex flex-col gap-3">
            {auditLogs.slice(0, 6).map((l) => (
              <div key={l.id} className="text-xs">
                <span className="text-ink font-medium">{l.user}</span>{" "}
                <span className="text-muted">{l.action.toLowerCase()}</span>
                <div className="text-muted font-mono mt-0.5">{l.date}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
