import { useState } from "react";
import { PageHeader, Card, Tabs, Field, inputCls, Button } from "../components/ui";

export default function SystemSettings() {
  const [tab, setTab] = useState("Store info");
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div>
      <PageHeader eyebrow="System" title="System Settings" description="Store info, locale, currency, and maintenance mode." />
      <Tabs tabs={["Store info", "Locale & currency", "Maintenance"]} active={tab} onChange={setTab} />

      {tab === "Store info" && (
        <Card className="p-5 max-w-xl">
          <Field label="Store name"><input className={inputCls} defaultValue="Electronics Cart" /></Field>
          <Field label="Support email"><input className={inputCls} defaultValue="support@electronicscart.in" /></Field>
          <Field label="Support phone"><input className={inputCls} defaultValue="+91 40 4567 8900" /></Field>
          <Field label="Registered address"><textarea className={inputCls} rows={3} defaultValue="Electronics Cart Pvt. Ltd., Hyderabad, Telangana, India" /></Field>
          <Button variant="primary">Save changes</Button>
        </Card>
      )}

      {tab === "Locale & currency" && (
        <Card className="p-5 max-w-xl">
          <Field label="Currency"><select className={inputCls}><option>INR (₹)</option><option>USD ($)</option></select></Field>
          <Field label="Timezone"><select className={inputCls}><option>Asia/Kolkata (IST, UTC+5:30)</option><option>Asia/Dubai (UTC+4)</option></select></Field>
          <Field label="Default language"><select className={inputCls}><option>English</option><option>Telugu</option><option>Hindi</option></select></Field>
          <Button variant="primary">Save changes</Button>
        </Card>
      )}

      {tab === "Maintenance" && (
        <Card className="p-5 max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium text-sm">Maintenance mode</div>
              <div className="text-xs text-muted">Take the storefront offline for scheduled maintenance.</div>
            </div>
            <button onClick={() => setMaintenance(!maintenance)} className={`w-9 h-5 rounded-full relative transition-colors ${maintenance ? "bg-danger" : "bg-border"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${maintenance ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          <Field label="Maintenance message"><textarea className={inputCls} rows={3} defaultValue="We'll be back shortly — Electronics Cart is undergoing scheduled maintenance." /></Field>
          <div className="pt-2 border-t border-border mt-4">
            <div className="font-medium text-sm mb-1">Backups</div>
            <div className="text-xs text-muted mb-3">Last backup: Aug 3, 2026, 3:00 AM IST</div>
            <Button variant="secondary">Run backup now</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
