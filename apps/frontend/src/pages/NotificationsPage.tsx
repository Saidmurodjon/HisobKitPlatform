import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.js";
import { Badge } from "@/components/ui/badge.js";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/store/api/notificationsApi.js";
import { formatRelativeTime } from "@/lib/utils.js";
import { cn } from "@/lib/utils.js";
import type { NotificationType } from "@/types/index.js";

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  EXPENSE_ADDED: "💸",
  EXPENSE_CONFIRMED: "✅",
  EXPENSE_REJECTED: "❌",
  SETTLEMENT_REQUEST: "🤝",
  SETTLEMENT_COMPLETED: "💚",
  GROUP_INVITE: "👥",
  SYSTEM: "🔔",
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetNotificationsQuery({ limit: 50 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const notifications = data?.data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleNotificationClick(notification: (typeof notifications)[number]) {
    if (!notification.isRead) {
      void markRead(notification.id);
    }

    const meta = notification.metaData as Record<string, string> | null;
    if (meta?.groupId) {
      navigate(`/groups/${meta.groupId}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={isMarkingAll}
            onClick={() => markAllRead()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-2xl">
          <Bell className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground">No notifications</p>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "w-full flex items-start gap-3 rounded-xl p-3.5 text-left transition-colors",
                "hover:bg-muted/60",
                !notification.isRead && "bg-primary/5 hover:bg-primary/10"
              )}
            >
              <span className="text-xl shrink-0 mt-0.5">
                {NOTIFICATION_ICONS[notification.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm leading-snug", !notification.isRead && "font-semibold")}>
                    {notification.title}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              {!notification.isRead && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
              {notification.metaData?.groupId && (
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
