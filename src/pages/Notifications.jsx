import { useState } from "react";
import { AlertTriangle, XCircle, MessageCircle, Package } from "lucide-react";
import { PageHeader, Card, Badge } from "../components/ui";

const seed = [
  { id: "N1", icon: AlertTriangle, tone: "amber", title: "Low stock: HP Pavilion 15", desc: "Only 3 units left at Hyderabad DC", time: "10 min ago" },
  { id: "N2", icon: XCircle, tone: "danger", title: "Payment failed for ORD-20260056", desc: "Gateway timeout on UPI payment", time: "42 min ago" },
  { id: "N3", icon: MessageCircle, tone: "primary", title: "New support ticket #4021", desc: "Customer asking about delayed delivery", time: "1 hr ago" },
  { id: "N4", icon: Package, tone: "success", title: "Restock complete: Dell XPS 13 Plus", desc: "40 units added at Bengaluru DC", time: "3 hr ago" },
  { id: "N5", icon: AlertTriangle, tone: "amber", title: "Low stock: Acer Aspire Lite", desc: "Only 5 units left at Mumbai DC", time: "5 hr ago" },
];

const routing = [
  { role: "Super Admin", channels: ["In-app", "Email"] },
  { role: "Manager", channels: ["In-app"] },
  { role: "Support", channels: ["In-app", "Email", "SMS"] },
];

export default function Notifications() {
  const [alerts, setAlerts] = useState(seed);
  return (
    <div>
      <PageHeader eyebrow="System" title="Notifications" description="System alerts for low stock, failed payments, and new tickets." />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-4 xl:col-span-2">
          <div className="flex flex-col divide-y divide-border">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${a.tone === "amber" ? "bg-amber-light text-amber" : a.tone === "danger" ? "bg-danger-light text-danger" : a.tone === "success" ? "bg-success-light text-success" : "bg-primary-light text-primary-dark"}`}>
                  <a.icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink">{a.title}</div>
                  <div className="text-xs text-muted">{a.desc}</div>
                </div>
                <span className="text-xs text-muted shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted mb-3">ROUTING BY ROLE</div>
          <div className="flex flex-col divide-y divide-border">
            {routing.map((r) => (
              <div key={r.role} className="py-3">
                <div className="text-sm font-medium mb-1.5">{r.role}</div>
                <div className="flex gap-1.5 flex-wrap">
                  {r.channels.map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
