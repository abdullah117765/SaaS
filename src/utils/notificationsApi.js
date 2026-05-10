import { apiRequest } from "./apiClient";

export const listNotifications = ({ unreadOnly, take, skip } = {}) => {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("unreadOnly", "true");
  if (take !== undefined) params.set("take", String(take));
  if (skip !== undefined) params.set("skip", String(skip));
  const qs = params.toString();
  return apiRequest(`/notifications${qs ? `?${qs}` : ""}`);
};

export const markNotificationRead = (id) =>
  apiRequest(`/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  apiRequest("/notifications/read-all", { method: "POST" });
