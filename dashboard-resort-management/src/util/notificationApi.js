import { request } from "./request";

export async function fetchAdminNotifications(params = {}) {
  const qs = new URLSearchParams();
  if (params.unread) qs.set("unread", "1");
  if (params.per_page) qs.set("per_page", String(params.per_page));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`admin/notifications${suffix}`, "get");
}

export async function markAdminNotificationRead(id) {
  return request(`admin/notifications/${id}/read`, "patch");
}

export async function markAllAdminNotificationsRead() {
  return request("admin/notifications/read-all", "post");
}
