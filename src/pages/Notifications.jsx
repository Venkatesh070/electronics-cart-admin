import { Bell, CheckCheck } from "lucide-react";
import { notificationsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../auth/AuthContext";
import { formatDateTime, idOf, titleCase } from "../utils/format";
import { PageHeader, Card, Button, Badge, LoadingState, ErrorState, EmptyState } from "../components/ui";

export default function Notifications() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => notificationsApi.list(), []);
  const notifications = data?.data || [];
  const unread = notifications.filter((item) => !item.isRead).length;

  async function markRead(notification) {
    if (notification.isRead) return;
    try {
      await notificationsApi.markRead(idOf(notification));
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      await reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Inbox" title="Notifications" description={`Live notification feed for ${user?.name || "the current admin"}.`} action={<Button variant="secondary" disabled={!unread} onClick={markAllRead}><CheckCheck size={14} /> Mark all read</Button>} />
      {loading ? <LoadingState label="Loading notifications…" /> : error ? <ErrorState message={error} onRetry={reload} /> : !notifications.length ? (
        <Card><EmptyState icon={Bell} title="No notifications" description="New account notifications will appear here." /></Card>
      ) : (
        <Card className="divide-y divide-border">
          {notifications.map((notification) => (
            <button key={idOf(notification)} onClick={() => markRead(notification)} className={`w-full text-left p-4 flex gap-3 hover:bg-bg/70 ${notification.isRead ? "" : "bg-primary-light/30"}`}>
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${notification.isRead ? "bg-border" : "bg-primary"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="font-medium text-sm text-ink">{notification.title}</span><Badge tone={notification.isRead ? "neutral" : "primary"}>{notification.isRead ? "Read" : "New"}</Badge><span className="text-xs text-muted ml-auto">{formatDateTime(notification.createdAt)}</span></div>
                <p className="text-sm text-muted mt-1">{notification.message}</p>
                <span className="text-xs text-muted font-mono mt-2 inline-block">{titleCase(notification.type)}</span>
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
