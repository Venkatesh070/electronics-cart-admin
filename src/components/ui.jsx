import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import clsx from "clsx";

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-1">{eyebrow}</div>
        )}
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="text-sm text-muted mt-1 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children }) {
  return (
    <div className={clsx("bg-surface border border-border rounded-card shadow-card", className)}>
      {children}
    </div>
  );
}

export function Button({ variant = "primary", size = "md", className, ...props }) {
  const base = "inline-flex items-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "text-xs px-2.5 py-1.5", md: "text-sm px-3.5 py-2" };
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-white border border-border text-ink hover:bg-bg",
    ghost: "text-ink hover:bg-bg",
    danger: "bg-danger text-white hover:bg-red-600",
  };
  return <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />;
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-gray-100 text-gray-700",
    primary: "bg-primary-light text-primary-dark",
    success: "bg-success-light text-success",
    amber: "bg-amber-light text-amber",
    danger: "bg-danger-light text-danger",
  };
  return <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", tones[tone])}>{children}</span>;
}

export function KPICard({ label, value, sub, subTone = "success", icon: Icon }) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted font-medium">{label}</span>
        {Icon && <Icon size={16} className="text-muted" />}
      </div>
      <span className="font-display text-2xl font-semibold text-ink">{value}</span>
      {sub && (
        <span className={clsx("text-xs font-medium", subTone === "success" ? "text-success" : subTone === "danger" ? "text-danger" : "text-muted")}>
          {sub}
        </span>
      )}
    </Card>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-md bg-white w-56 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </div>
  );
}

export function Select({ value, onChange, options, className }) {
  return (
    <div className={clsx("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  );
}

export function Table({ columns, rows, onRowClick, empty = "No records found." }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th key={c.key} className="text-left font-medium text-xs text-muted uppercase tracking-wide px-3 py-2.5 whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="text-center text-muted text-sm py-10">{empty}</td></tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              className={clsx("border-b border-border last:border-0 hover:bg-bg/70", onRowClick && "cursor-pointer")}
            >
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2.5 align-middle whitespace-nowrap">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className={clsx("relative bg-surface rounded-card shadow-pop w-full max-h-[85vh] overflow-y-auto scrollbar-thin", width)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, width = "max-w-xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className={clsx("relative bg-surface h-full w-full overflow-y-auto scrollbar-thin shadow-pop", width)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full text-sm border border-border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-border mb-5">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={clsx(
            "px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            active === t ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && <Icon size={28} className="text-muted mb-3" />}
      <h4 className="font-display font-semibold text-ink mb-1">{title}</h4>
      {description && <p className="text-sm text-muted max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function useSearchFilter(list, fields) {
  const [q, setQ] = useState("");
  const filtered = list.filter((item) =>
    q.trim() === "" ? true : fields.some((f) => String(item[f] ?? "").toLowerCase().includes(q.toLowerCase()))
  );
  return [filtered, q, setQ];
}
