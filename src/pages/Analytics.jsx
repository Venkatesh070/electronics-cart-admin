import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, FunnelChart, Funnel, LabelList, BarChart, Bar } from "recharts";
import { PageHeader, Card, KPICard } from "../components/ui";
import { Users, MousePointerClick, ShoppingBag, Repeat } from "lucide-react";

const traffic = [
  { d: "Mon", visits: 3200 }, { d: "Tue", visits: 3600 }, { d: "Wed", visits: 4100 },
  { d: "Thu", visits: 3900 }, { d: "Fri", visits: 4700 }, { d: "Sat", visits: 5600 }, { d: "Sun", visits: 5100 },
];

const funnel = [
  { name: "Visited site", value: 28000, fill: "#3654FF" },
  { name: "Viewed product", value: 15400, fill: "#5C79FF" },
  { name: "Added to cart", value: 6200, fill: "#8FA2FF" },
  { name: "Started checkout", value: 3100, fill: "#FF8A3D" },
  { name: "Completed order", value: 1980, fill: "#16A34A" },
];

const topProducts = [
  { name: "MacBook Air 13 M3", views: 4200 },
  { name: "Dell XPS 13 Plus", views: 3600 },
  { name: "Lenovo Legion 5 Pro", views: 3100 },
  { name: "HP Pavilion 15", views: 2800 },
  { name: "Asus ROG Zephyrus G14", views: 2400 },
];

const channels = [
  { name: "Organic search", value: 41 },
  { name: "Direct", value: 24 },
  { name: "Social", value: 18 },
  { name: "Paid ads", value: 12 },
  { name: "Referral", value: 5 },
];

export default function Analytics() {
  return (
    <div>
      <PageHeader eyebrow="Insights" title="Analytics" description="Traffic, conversion funnel, top products, and channel performance." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label="Weekly visitors" value="30.2k" sub="+6.8%" icon={Users} />
        <KPICard label="Conversion rate" value="7.1%" sub="+0.4pp" icon={MousePointerClick} />
        <KPICard label="Cart→order rate" value="31.9%" sub="-1.2pp" subTone="danger" icon={ShoppingBag} />
        <KPICard label="Repeat purchase rate" value="24.6%" sub="+2.1pp" icon={Repeat} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 xl:col-span-2">
          <h3 className="font-display font-semibold text-sm mb-4">Weekly traffic</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={traffic} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4E7EC" }} />
              <Line type="monotone" dataKey="visits" stroke="#3654FF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Traffic channels</h3>
          <div className="flex flex-col gap-2.5">
            {channels.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs mb-1"><span className="text-ink">{c.name}</span><span className="text-muted font-mono">{c.value}%</span></div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${c.value * 2}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Conversion funnel</h3>
          <div className="flex flex-col gap-2">
            {funnel.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                <div className="w-32 text-xs text-muted shrink-0">{f.name}</div>
                <div className="flex-1 h-6 bg-bg rounded overflow-hidden">
                  <div className="h-full rounded flex items-center px-2 text-[10px] text-white font-medium" style={{ width: `${(f.value / funnel[0].value) * 100}%`, background: f.fill }}>
                    {f.value.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Top products by views</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#12151C" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4E7EC" }} />
              <Bar dataKey="views" fill="#3654FF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
