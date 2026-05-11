import { useCallback, useEffect, useState } from "react";
import { FaBell, FaCheckDouble, FaCircle } from "react-icons/fa";
import {
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "../utils/notificationsApi";

const TYPE_LABEL = {
  PAYMENT_RECEIVED: "Payment received",
  PAYMENT_FAILED: "Payment failed",
  SUBSCRIPTION_ACTIVATED: "Subscription activated",
  SUBSCRIPTION_CANCELLED: "Subscription cancelled",
  COUPON_REDEEMED: "Coupon redeemed",
  MEMBERSHIP_PENDING: "Membership pending",
  MEMBERSHIP_APPROVED: "Membership approved",
  MEMBERSHIP_REJECTED: "Membership rejected",
  GENERIC: "Notification",
};

const TYPE_TONE = {
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-700",
  PAYMENT_FAILED: "bg-rose-100 text-rose-700",
  SUBSCRIPTION_ACTIVATED: "bg-indigo-100 text-indigo-700",
  SUBSCRIPTION_CANCELLED: "bg-amber-100 text-amber-700",
  COUPON_REDEEMED: "bg-fuchsia-100 text-fuchsia-700",
  MEMBERSHIP_PENDING: "bg-amber-100 text-amber-700",
  MEMBERSHIP_APPROVED: "bg-emerald-100 text-emerald-700",
  MEMBERSHIP_REJECTED: "bg-rose-100 text-rose-700",
  GENERIC: "bg-gray-100 text-gray-700",
};

const formatDate = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications({
        unreadOnly: filter === "unread",
        take: 50,
      });
      const data = res?.data ?? res ?? {};
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const onMarkRead = async (id) => {
    setBusyId(id);
    try {
      await markNotificationRead(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const onMarkAll = async () => {
    setBusyId("all");
    try {
      await markAllNotificationsRead();
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
              <FaBell className="text-primary-600" /> Notifications
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {unread > 0
                ? `${unread} unread message${unread === 1 ? "" : "s"}`
                : "You're all caught up."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-gray-200 bg-white p-1 text-sm">
              <button
                onClick={() => setFilter("all")}
                className={`rounded px-3 py-1 ${
                  filter === "all"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`rounded px-3 py-1 ${
                  filter === "unread"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Unread
              </button>
            </div>
            <button
              type="button"
              onClick={onMarkAll}
              disabled={busyId === "all" || unread === 0}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaCheckDouble /> Mark all read
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No notifications to show.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <li
                    key={n.id}
                    className={`flex gap-4 p-4 transition ${
                      isUnread ? "bg-primary-50/40" : "bg-white"
                    }`}
                  >
                    <div className="pt-1">
                      <FaCircle
                        className={`h-2 w-2 ${
                          isUnread ? "text-primary-500" : "text-transparent"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                              TYPE_TONE[n.type] ?? TYPE_TONE.GENERIC
                            }`}
                          >
                            {TYPE_LABEL[n.type] ?? n.type}
                          </span>
                          <h3 className="mt-1 text-sm font-semibold text-gray-900">
                            {n.title}
                          </h3>
                          {n.body && (
                            <p className="mt-1 text-sm text-gray-600">
                              {n.body}
                            </p>
                          )}
                        </div>
                        <span className="whitespace-nowrap text-xs text-gray-400">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                      {isUnread && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => onMarkRead(n.id)}
                            disabled={busyId === n.id}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                          >
                            {busyId === n.id ? "Marking..." : "Mark as read"}
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
