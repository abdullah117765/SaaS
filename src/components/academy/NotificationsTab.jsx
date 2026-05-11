import { AnimatePresence, motion } from "framer-motion";
import {
    FaBell,
    FaCheck,
    FaCheckDouble,
    FaInfoCircle,
    FaTimes,
    FaUserCheck
} from "react-icons/fa";
import apiRequest from "../../utils/apiClient";

const TYPE_CONFIG = {
  approval: {
    icon: FaUserCheck,
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    border: "border-indigo-200",
  },
  system: {
    icon: FaInfoCircle,
    bg: "bg-sky-100",
    text: "text-sky-600",
    border: "border-sky-200",
  },
  alert: {
    icon: FaBell,
    bg: "bg-amber-100",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  default: {
    icon: FaBell,
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
  },
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
};

const NotificationsTab = ({
  notifications,
  setNotifications,
  setUnreadNotifications,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      await apiRequest("/notifications/mark-all-read", { method: "PATCH" });
    } catch {
      // silently ignore — still update local state
    }
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadNotifications(0);
  };

  const markAsRead = async (id) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // silently ignore
    }
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    setNotifications(updated);
    setUnreadNotifications(updated.filter((n) => !n.read).length);
  };

  const deleteNotification = async (id) => {
    try {
      await apiRequest(`/notifications/${id}`, { method: "DELETE" });
    } catch {
      // silently ignore
    }
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    setUnreadNotifications(updated.filter((n) => !n.read).length);
  };

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl border border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50">
            <FaBell className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Notifications
            </h3>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <FaCheckDouble className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-b-xl border border-t-0 border-slate-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <FaBell className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            No notifications yet
          </p>
          <p className="text-xs text-slate-400">
            We'll let you know when something happens.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-b-xl border border-t-0 border-slate-200 bg-white">
          <AnimatePresence initial={false}>
            {notifications.map((notification) => {
              const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.default;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`relative flex gap-4 px-6 py-4 transition-colors ${notification.read ? "bg-white" : "bg-indigo-50/50"}`}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-indigo-500" />
                  )}

                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${cfg.bg} ${cfg.border}`}
                  >
                    <Icon className={`h-4 w-4 ${cfg.text}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-semibold leading-snug ${notification.read ? "text-slate-700" : "text-slate-900"}`}
                      >
                        {notification.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatTime(
                          notification.time ??
                            notification.createdAt ??
                            notification.date,
                        )}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {notification.message}
                    </p>
                    {notification.actionLink && (
                      <a
                        href={notification.actionLink}
                        className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {notification.actionText ?? "View details"} →
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-start gap-1 pt-0.5">
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                        className="rounded-md p-1.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                      >
                        <FaCheck className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      title="Dismiss"
                      className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
