import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2, Zap } from "lucide-react";
import { flashSalesApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, idOf } from "../utils/format";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from "../components/ui";

function saleStatus(s) {
  if (s.status === "DRAFT") return "Draft";
  if (s.status === "INACTIVE" || s.active === false) return "Inactive";
  const now = Date.now();
  if (now > new Date(s.endsAt).getTime()) return "Ended";
  if (now < new Date(s.startsAt).getTime()) return "Scheduled";
  return "Live";
}

export default function FlashSales() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(async () => (await flashSalesApi.list()).data || [], []);
  const sales = data || [];

  async function remove(id) {
    if (!confirm("Delete this flash sale?")) return;
    try {
      await flashSalesApi.remove(id);
      await reload();
    } catch (e) {
      alert(e?.message || "Could not delete flash sale");
    }
  }

  if (loading && !data) return <LoadingState label="Loading flash sales…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        eyebrow="Marketing"
        title="Flash Sales"
        description="Create time-boxed sales with stock caps and track live performance."
        action={
          <Button onClick={() => navigate("/flash-sales/new")}>
            <Plus size={14} /> Create flash sale
          </Button>
        }
      />
      {!sales.length ? (
        <Card>
          <EmptyState
            icon={Zap}
            title="No flash sales"
            description="Create a limited-time promotion to boost conversions."
            action={<Button onClick={() => navigate("/flash-sales/new")}>Create flash sale</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sales.map((s) => {
            const lines = s.products || [];
            const sold = lines.reduce((sum, p) => sum + (Number(p.soldCount) || 0), 0);
            const cap = lines.reduce((sum, p) => sum + (Number(p.stockCap) || 0), 0);
            const status = saleStatus(s);
            const discount =
              s.discountType === "fixed"
                ? `₹${s.discountValue || 0}`
                : `${s.discountValue ?? Math.max(0, ...lines.map((p) => Number(p.discountPercent) || 0))}%`;
            return (
              <Card key={idOf(s)} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-amber-light text-amber flex items-center justify-center shrink-0">
                      <Zap size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{s.name}</div>
                      <div className="text-xs text-muted">
                        {s.saleType === "product_specific" ? "Product Specific" : "Sitewide"} · {discount} off
                        {lines.length ? ` · ${lines.length} products` : ""}
                        {s.categories?.length ? ` · ${s.categories.length} categories` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      tone={
                        status === "Live"
                          ? "success"
                          : status === "Scheduled" || status === "Draft"
                            ? "amber"
                            : "neutral"
                      }
                    >
                      {status}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => navigate(`/flash-sales/${idOf(s)}/edit`)}
                      className="p-1.5 text-muted hover:text-ink"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(idOf(s))}
                      className="p-1.5 text-muted hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {cap > 0 && (
                  <>
                    <div className="text-xs text-muted mb-1.5">
                      Stock sold: {sold}/{cap}
                    </div>
                    <div className="h-2 bg-bg rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-amber"
                        style={{ width: `${Math.min(100, (sold / cap) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xs font-mono text-muted">
                  <span>{formatDate(s.startsAt)}</span>
                  <span>→</span>
                  <span>{formatDate(s.endsAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
