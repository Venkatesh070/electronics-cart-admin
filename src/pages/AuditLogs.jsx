import { useState } from "react";
import { auditLogsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDateTime, nameOf, titleCase } from "../utils/format";
import { PageHeader, Card, Table, SearchInput, Select, Button, LoadingState, ErrorState } from "../components/ui";

export default function AuditLogs() {
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [user, setUser] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState("25");
  const { data, loading, error, reload } = useAsync(() => auditLogsApi.list({
    ...(module ? { module } : {}),
    ...(action ? { action } : {}),
    ...(user ? { user } : {}),
    page,
    limit: Number(limit),
  }), [module, action, user, page, limit]);
  const pagination = data?.pagination || {};

  function filter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div>
      <PageHeader eyebrow="Security" title="Audit logs" description="Review live administrative actions across modules and users." />
      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <SearchInput value={module} onChange={filter(setModule)} placeholder="Filter by module…" />
        <SearchInput value={action} onChange={filter(setAction)} placeholder="Search action…" />
        <SearchInput value={user} onChange={filter(setUser)} placeholder="Filter by user ID…" />
        <Select value={limit} onChange={filter(setLimit)} options={[{ value: "25", label: "25 per page" }, { value: "50", label: "50 per page" }, { value: "100", label: "100 per page" }]} />
      </Card>
      {loading ? <LoadingState label="Loading audit logs…" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <Card className="p-4"><Table rows={data?.data || []} columns={[
            { key: "user", label: "User", render: (r) => r.userName || nameOf(r.user) },
            { key: "action", label: "Action" },
            { key: "module", label: "Module", render: (r) => titleCase(r.module) },
            { key: "createdAt", label: "Date", render: (r) => formatDateTime(r.createdAt) },
          ]} /></Card>
          <div className="flex items-center justify-between mt-4 text-xs text-muted">
            <span>{pagination.total || 0} total records</span>
            <div className="flex items-center gap-2"><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span>Page {pagination.page || page} of {pagination.pages || 1}</span><Button size="sm" variant="secondary" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
          </div>
        </>
      )}
    </div>
  );
}
