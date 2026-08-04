import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { brandsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { idOf, mediaUrl } from "../utils/format";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from "../components/ui";

export default function Brands() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(async () => (await brandsApi.list()).data || [], []);
  const [saving, setSaving] = useState(false);
  const brands = data || [];

  async function mutate(task) {
    setSaving(true);
    try {
      await task();
      await reload();
    } catch (e) {
      alert(e?.message || "Request failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (confirm("Delete this brand?")) await mutate(() => brandsApi.remove(id));
  }

  async function toggleFeatured(b) {
    await mutate(() => brandsApi.update(idOf(b), { featured: !b.featured }));
  }

  if (loading && !data) return <LoadingState label="Loading brands…" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Brands"
        description="Manage brand listings and control which brands are featured on the homepage."
        action={
          <Button onClick={() => navigate("/brands/new")}>
            <Plus size={14} /> Add brand
          </Button>
        }
      />
      {!brands.length ? (
        <Card>
          <EmptyState
            title="No brands yet"
            action={<Button onClick={() => navigate("/brands/new")}>Add brand</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {brands.map((b) => (
            <Card key={idOf(b)} className="p-4">
              <div className="flex items-start justify-between mb-3">
                {b.logo ? (
                  <img src={mediaUrl(b.logo)} alt="" className="w-11 h-11 rounded-md object-contain bg-primary-light" />
                ) : (
                  <div className="w-11 h-11 rounded-md bg-primary-light text-primary-dark flex items-center justify-center font-display font-semibold">
                    {b.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex gap-1">
                  <button type="button" onClick={() => navigate(`/brands/${idOf(b)}/edit`)} className="p-1.5 text-muted">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => remove(idOf(b))} className="p-1.5 text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="font-medium text-ink flex items-center gap-2">
                {b.name}
                {b.status && b.status !== "ACTIVE" && (
                  <Badge tone={b.status === "DRAFT" ? "amber" : "neutral"}>{b.status}</Badge>
                )}
              </div>
              <div className="text-xs text-muted mb-3">{b.productCount || 0} products</div>
              <button
                type="button"
                onClick={() => toggleFeatured(b)}
                disabled={saving}
                className={`flex items-center gap-1.5 text-xs font-medium ${b.featured ? "text-amber" : "text-muted"}`}
              >
                <Star size={13} fill={b.featured ? "currentColor" : "none"} />{" "}
                {b.featured ? "Featured on homepage" : "Feature on homepage"}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
