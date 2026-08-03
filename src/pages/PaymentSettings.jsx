import { useState } from "react";
import { CreditCard, Smartphone, Landmark, Wallet, Banknote, Percent } from "lucide-react";
import { PageHeader, Card, Field, inputCls, Button } from "../components/ui";

const initial = [
  { id: "cards", name: "Credit / Debit cards", icon: CreditCard, enabled: true },
  { id: "upi", name: "UPI", icon: Smartphone, enabled: true },
  { id: "netbanking", name: "Net banking", icon: Landmark, enabled: true },
  { id: "wallet", name: "Wallets", icon: Wallet, enabled: false },
  { id: "cod", name: "Cash on delivery", icon: Banknote, enabled: true },
  { id: "emi", name: "EMI", icon: Percent, enabled: true },
];

export default function PaymentSettings() {
  const [methods, setMethods] = useState(initial);

  return (
    <div>
      <PageHeader eyebrow="Finance" title="Payment Settings" description="Enable payment methods and manage gateway credentials." />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-4 xl:col-span-2">
          <div className="text-xs font-medium text-muted mb-3">ENABLED PAYMENT METHODS</div>
          <div className="flex flex-col divide-y divide-border">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5"><m.icon size={16} className="text-muted" /><span className="text-sm font-medium">{m.name}</span></div>
                <button
                  onClick={() => setMethods(methods.map((x) => x.id === m.id ? { ...x, enabled: !x.enabled } : x))}
                  className={`w-9 h-5 rounded-full relative transition-colors ${m.enabled ? "bg-primary" : "bg-border"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${m.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-medium text-muted mb-3">GATEWAY CREDENTIALS</div>
          <Field label="Gateway"><select className={inputCls}><option>Razorpay</option><option>PayU</option><option>Cashfree</option></select></Field>
          <Field label="API key"><input className={inputCls} type="password" defaultValue="••••••••••••1234" /></Field>
          <Field label="API secret"><input className={inputCls} type="password" defaultValue="••••••••••••••••" /></Field>
          <Field label="Settlement account"><input className={inputCls} defaultValue="HDFC •• 4821" /></Field>
          <Button variant="primary" className="w-full justify-center">Save credentials</Button>
        </Card>
      </div>
    </div>
  );
}
