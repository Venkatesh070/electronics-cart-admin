import { Download } from "lucide-react";
import { reportsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { downloadCsv, formatDate, formatINR, nameOf, titleCase } from "../utils/format";
import { PageHeader, Card, Button, Table, Select, LoadingState, ErrorState, EmptyState } from "../components/ui";
import { useState } from "react";

const reportTypes = ["sales", "inventory", "customers", "tax"];

function printable(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return nameOf(value, JSON.stringify(value));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function displayValue(key, value) {
  if (/revenue|spend|price|tax|shipping|discount/i.test(key) && typeof value === "number") return formatINR(value);
  if (/date|createdAt|updatedAt/i.test(key)) return formatDate(value);
  return printable(value);
}

export default function Reports() {
  const [type, setType] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, loading, error, reload } = useAsync(() => reportsApi.get({ type, ...(from ? { from } : {}), ...(to ? { to } : {}) }), [type, from, to]);
  const rows = data?.data?.rows || [];
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !["__v", "variants"].includes(key))))];
  const columns = keys.map((key) => ({ key, label: key === "_id" ? (type === "sales" ? "Date" : "Group") : titleCase(key), render: (row) => displayValue(key, row[key]) }));
  const exportRows = rows.map((row) => Object.fromEntries(keys.map((key) => [key === "_id" ? "group" : key, printable(row[key])])));

  return (
    <div>
      <PageHeader eyebrow="Insights" title="Reports" description="Generate live operational reports for a selected period." action={<Button variant="secondary" disabled={!rows.length} onClick={() => downloadCsv(`${type}-report.csv`, exportRows)}><Download size={14} /> Export CSV</Button>} />
      <Card className="p-4 mb-4 flex flex-wrap gap-3 items-end">
        <label className="text-xs text-muted">Report type<Select className="mt-1" value={type} onChange={setType} options={reportTypes.map((value) => ({ value, label: titleCase(value) }))} /></label>
        <label className="text-xs text-muted">From<input className="block mt-1 border border-border rounded-md px-3 py-1.5 text-sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-muted">To<input className="block mt-1 border border-border rounded-md px-3 py-1.5 text-sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </Card>
      {loading ? <LoadingState label={`Loading ${type} report…`} /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length ? (
        <Card className="p-4"><Table rows={rows} columns={columns} /></Card>
      ) : <Card><EmptyState title="No report data" description="No records matched the selected report and date range." /></Card>}
    </div>
  );
}
