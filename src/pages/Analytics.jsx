import { BarChart3, Search, ShoppingCart, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analyticsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatINRCompact } from "../utils/format";
import { PageHeader, Card, KPICard, LoadingState, ErrorState, EmptyState } from "../components/ui";

const chartProps = { margin: { left: -20, right: 12, top: 8 } };
const axisTick = { fontSize: 11, fill: "#6B7280" };

function ChartCard({ title, children, empty }) {
  return <Card className="p-5"><h3 className="font-display font-semibold text-sm text-ink mb-4">{title}</h3>{empty ? <EmptyState title="No data yet" description="This series has no live data for the selected dataset." /> : children}</Card>;
}

export default function Analytics() {
  const { data, loading, error, reload } = useAsync(() => analyticsApi.get(), []);
  if (loading) return <LoadingState label="Loading analytics…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const analytics = data?.data || {};
  const topProducts = analytics.topProducts || [];
  const topCategories = analytics.topCategories || [];
  const searchTrends = analytics.searchTrends || [];
  const reviewStats = analytics.reviewStats || [];
  const conversion = analytics.conversion || {};

  return (
    <div>
      <PageHeader eyebrow="Insights" title="Analytics" description="Live product, search, review and conversion performance." />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <KPICard label="Searches" value={conversion.searches || 0} icon={Search} />
        <KPICard label="Customers" value={conversion.customers || 0} icon={Users} />
        <KPICard label="Orders" value={conversion.orders || 0} icon={ShoppingCart} />
        <KPICard label="Order conversion" value={`${((conversion.orderRate || 0) * 100).toFixed(1)}%`} icon={BarChart3} />
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        <ChartCard title="Top products by revenue" empty={!topProducts.length}>
          <ResponsiveContainer width="100%" height={280}><BarChart data={topProducts} {...chartProps}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" /><XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} interval={0} angle={-15} height={60} /><YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatINRCompact} /><Tooltip formatter={(value) => formatINRCompact(value)} /><Bar dataKey="revenue" fill="#3654FF" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top categories by revenue" empty={!topCategories.length}>
          <ResponsiveContainer width="100%" height={280}><BarChart data={topCategories} {...chartProps}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" /><XAxis dataKey="_id" tick={axisTick} axisLine={false} tickLine={false} /><YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatINRCompact} /><Tooltip formatter={(value) => formatINRCompact(value)} /><Bar dataKey="revenue" fill="#16A34A" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Search trends" empty={!searchTrends.length}>
          <ResponsiveContainer width="100%" height={260}><LineChart data={searchTrends} {...chartProps}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" /><XAxis dataKey="_id" tick={axisTick} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#FF8A3D" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Reviews by rating" empty={!reviewStats.length}>
          <ResponsiveContainer width="100%" height={260}><BarChart data={reviewStats} {...chartProps}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" /><XAxis dataKey="_id" tick={axisTick} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" fill="#8B9DFF" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
