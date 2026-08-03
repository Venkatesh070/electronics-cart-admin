import { useState } from "react";
import { Check, Flag, Star, X } from "lucide-react";
import { reviewsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, idOf, nameOf, titleCase } from "../utils/format";
import {
  PageHeader,
  Card,
  Select,
  Badge,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components/ui";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "flagged", label: "Flagged" },
  { value: "", label: "All" },
];

function statusTone(status) {
  if (status === "approved") return "success";
  if (status === "rejected" || status === "flagged") return "danger";
  return "amber";
}

export default function Reviews() {
  const [status, setStatus] = useState("pending");
  const [savingId, setSavingId] = useState("");
  const [actionError, setActionError] = useState("");
  const query = useAsync(() => reviewsApi.list(status ? { status } : {}), [status]);
  const reviews = Array.isArray(query.data?.data) ? query.data.data : [];

  async function moderate(review, nextStatus) {
    const id = idOf(review);
    setSavingId(id);
    setActionError("");
    try {
      await reviewsApi.moderate(id, nextStatus);
      await query.reload();
    } catch (error) {
      setActionError(error?.message || "Could not moderate this review.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title="Reviews"
        description="Moderate product reviews before they go live on the storefront."
      />
      <div className="flex items-center gap-2 mb-4">
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <span className="text-xs text-muted">{reviews.length} reviews</span>
      </div>

      {actionError && <p className="text-sm text-danger mb-3">{actionError}</p>}
      {query.loading ? (
        <LoadingState label="Loading reviews…" />
      ) : query.error ? (
        <ErrorState message={query.error} onRetry={query.reload} />
      ) : reviews.length ? (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => {
            const reviewStatus = review.status || "pending";
            const productName = nameOf(review.product, "Unknown product");
            const reviewerName = nameOf(review.user, "Unknown customer");
            return (
              <Card key={idOf(review)} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <div className="flex text-amber" aria-label={`${review.rating || 0} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={13}
                            fill={index < Number(review.rating) ? "currentColor" : "none"}
                            className={index < Number(review.rating) ? "" : "text-border"}
                          />
                        ))}
                      </div>
                      {reviewStatus === "flagged" && (
                        <Badge tone="danger"><Flag size={10} className="mr-1 inline" />Flagged</Badge>
                      )}
                      <Badge tone={statusTone(reviewStatus)}>{titleCase(reviewStatus)}</Badge>
                    </div>
                    <div className="font-medium text-ink text-sm">
                      {review.title || `Review for ${productName}`}
                    </div>
                    <p className="text-sm text-muted mt-0.5 whitespace-pre-wrap">{review.text || "No review text."}</p>
                    <div className="text-xs text-muted mt-2">
                      {reviewerName} · on <span className="text-ink">{productName}</span> · {formatDate(review.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moderate(review, "rejected")}
                      disabled={savingId === idOf(review) || reviewStatus === "rejected"}
                    >
                      <X size={13} /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => moderate(review, "approved")}
                      disabled={savingId === idOf(review) || reviewStatus === "approved"}
                    >
                      <Check size={13} /> Approve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Flag}
            title="No reviews found"
            description="There are no reviews in this moderation state."
          />
        </Card>
      )}
    </div>
  );
}
