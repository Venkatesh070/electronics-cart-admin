import { useState } from "react";
import { PageHeader, Card, Table, Select, SearchInput, useSearchFilter } from "../components/ui";
import { auditLogs as seed } from "../data/misc";

export default function AuditLogs() {
  const [filtered, q, setQ] = useSearchFilter(seed, ["user", "action", "module"]);
  const [module, setModule] = useState("All");
  const modules = ["All", ...new Set(seed.map((l) => l.module))];
  const rows = filtered.filter((l) => module === "All" || l.module === module);

  return (
    <div>
      <PageHeader eyebrow="System" title="Audit Logs" description="Chronological log of admin actions across the platform." />
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search user or action…" />
          <Select value={module} onChange={setModule} options={modules} />
        </div>
        <Table
          columns={[
            { key: "date", label: "Timestamp", render: (r) => <span className="font-mono text-xs text-muted">{r.date}</span> },
            { key: "user", label: "User" },
            { key: "action", label: "Action" },
            { key: "module", label: "Module" },
          ]}
          rows={rows}
        />
      </Card>
    </div>
  );
}
