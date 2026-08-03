import { AlertTriangle, Boxes, Headphones, IndianRupee, PackageCheck, PackagePlus, Plus, RotateCcw, ShoppingCart, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../auth/AuthContext";
import { formatDate, formatINR, formatINRCompact, idOf, nameOf, titleCase } from "../utils/format";
import { PageHeader, Card, KPICard, Button, Table, Badge, LoadingState, ErrorState, EmptyState } from "../components/ui";
import StatusDot from "../components/StatusDot";

const STATUS_COLORS = {
  pending: "#FF8A3D",
  confirmed: "#3654FF",
  paid: "#16A34A",
  shipped: "#8B9DFF",
  out_for_delivery: "#FFC08A",
  delivered: "#16A34A",
  cancelled: "#E5484D",
};

function ChartEmpty({ title }) {
  return <EmptyState title={`No ${title} data`} description="Live data will appear here when records are available." />;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => dashboardApi.get(), []);
  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const dashboard = data?.data || {};
  const kpis = dashboard.kpis || {};
  const trend = dashboard.trend || [];
  const ordersByStatus = dashboard.ordersByStatus || [];
  const salesByBrand = dashboard.salesByBrand || [];
  const recentOrders = dashboard.recentOrders || [];
  const lowStockAlerts = dashboard.lowStockAlerts || [];

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Hello, ${user?.name || "Admin"}`}
        description="Here is the latest live performance from your store."
        action={<div className="flex gap-2"><Link to="/orders"><Button variant="secondary"><Plus size={14} /> Create order</Button></Link><Link to="/products"><Button><Plus size={14} /> Add product</Button></Link></div>}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
        <KPICard label="Revenue" value={formatINRCompact(kpis.revenue)} icon={IndianRupee} />
        <KPICard label="Orders" value={kpis.orders || 0} icon={ShoppingCart} />
        <KPICard label="Avg order value" value={formatINRCompact(kpis.aov)} icon={PackageCheck} />
        <KPICard label="New customers" value={kpis.newCustomers || 0} icon={Users} />
        <KPICard label="Products sold" value={kpis.productsSold || 0} icon={PackagePlus} />
        <KPICard label="Low stock" value={kpis.lowStock || 0} sub={kpis.lowStock ? "Needs attention" : undefined} subTone="danger" icon={Boxes} />
        <KPICard label="Open tickets" value={kpis.openTickets || 0} icon={Headphones} />
        <KPICard label="Pending returns" value={kpis.pendingReturns || 0} icon={RotateCcw} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 xl:col-span-2">
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Revenue trend</h3>
          {!trend.length ? <ChartEmpty title="revenue trend" /> : <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={trend} margin={{ left: -15, right: 12 }}>
              <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3654FF" stopOpacity={0.25} /><stop offset="100%" stopColor="#3654FF" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={formatINRCompact} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={formatDate} formatter={(value, key) => key === "revenue" ? formatINR(value) : value} />
              <Area type="monotone" dataKey="revenue" stroke="#3654FF" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>}
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Orders by status</h3>
          {!ordersByStatus.length ? <ChartEmpty title="order status" /> : <>
            <ResponsiveContainer width="100%" height={175}><PieChart><Pie data={ordersByStatus} dataKey="count" nameKey="_id" innerRadius={42} outerRadius={68} paddingAngle={2}>{ordersByStatus.map((item) => <Cell key={item._id} fill={STATUS_COLORS[item._id] || "#D8DCE3"} />)}</Pie><Tooltip formatter={(value, _key, item) => [value, titleCase(item.payload._id)]} /></PieChart></ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2">{ordersByStatus.map((item) => <div key={item._id} className="flex items-center gap-1.5 text-xs text-muted"><span className="led" style={{ background: STATUS_COLORS[item._id] || "#D8DCE3" }} />{titleCase(item._id)}<span className="ml-auto text-ink font-medium">{item.count}</span></div>)}</div>
          </>}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 xl:col-span-2">
          <h3 className="font-display font-semibold text-sm text-ink mb-4">Sales by brand</h3>
          {!salesByBrand.length ? <ChartEmpty title="brand sales" /> : <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesByBrand} margin={{ left: -15, right: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" /><XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} /><Tooltip formatter={(value, key) => key === "revenue" ? formatINR(value) : value} /><Bar dataKey="units" fill="#3654FF" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={15} className="text-amber" /><h3 className="font-display font-semibold text-sm text-ink">Low stock alerts</h3></div>
          {!lowStockAlerts.length ? <EmptyState title="Stock levels are healthy" /> : <div className="space-y-3">{lowStockAlerts.map((product) => <div key={idOf(product)} className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-sm font-medium truncate">{product.name}</div><div className="text-xs text-muted">Threshold: {product.minStock ?? product.lowStockThreshold}</div></div><Badge tone={product.stock === 0 ? "danger" : "amber"}>{product.stock} left</Badge></div>)}</div>}
          <Link to="/inventory" className="inline-block text-xs text-primary font-medium mt-4">Manage inventory →</Link>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-2"><h3 className="font-display font-semibold text-sm text-ink">Recent orders</h3><Link to="/orders" className="text-xs text-primary font-medium">View all →</Link></div>
        <Table rows={recentOrders} columns={[
          { key: "order", label: "Order", render: (r) => <span className="font-mono text-xs">#{idOf(r).slice(-8).toUpperCase()}</span> },
          { key: "customer", label: "Customer", render: (r) => nameOf(r.user) },
          { key: "amount", label: "Amount", render: (r) => formatINR(r.totalAmount) },
          { key: "status", label: "Status", render: (r) => <StatusDot status={r.status} label={titleCase(r.status)} /> },
          { key: "date", label: "Date", render: (r) => formatDate(r.createdAt) },
        ]} />
      </Card>
    </div>
  );
}
