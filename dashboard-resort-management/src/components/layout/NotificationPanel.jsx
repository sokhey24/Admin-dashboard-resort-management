import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Tabs } from "antd";
import { MdNotificationsNone } from "react-icons/md";
import { useTranslation } from "../../i18n";

const PAGE_SIZE = 5;

function actionStyle(action, dark) {
  const a = action?.toLowerCase();
  if (a === "created") return dark ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-100 text-emerald-700";
  if (a === "updated") return dark ? "bg-sky-900/40 text-sky-400" : "bg-sky-100 text-sky-700";
  if (a === "deleted") return dark ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-700";
  return dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600";
}

function actionIcon(action) {
  const a = action?.toLowerCase();
  if (a === "created") return "➕";
  if (a === "updated") return "✏️";
  if (a === "deleted") return "🗑️";
  return "🔔";
}

export default function NotificationPanel({
  darkMode,
  notifications,
  clearAll,
  onNotificationClick,
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const notifActionOptions = [
    { value: "all", label: t("notifications.filterAllActions", "All Actions") },
    { value: "created", label: t("notifications.actionCreated", "Created") },
    { value: "updated", label: t("notifications.actionUpdated", "Updated") },
    { value: "deleted", label: t("notifications.actionDeleted", "Deleted") },
  ];

  const baseFiltered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return notifications.filter((a) => {
      const matchSearch =
        !kw ||
        a.user_name?.toLowerCase().includes(kw) ||
        a.action?.toLowerCase().includes(kw) ||
        a.booking_code?.toLowerCase().includes(kw) ||
        a.status?.toLowerCase().includes(kw);
      const matchAction =
        !actionFilter ||
        actionFilter === "all" ||
        a.action?.toLowerCase() === actionFilter;
      return matchSearch && matchAction;
    });
  }, [notifications, search, actionFilter]);

  const tabFiltered = useMemo(() => {
    if (tab === "unread") return baseFiltered.filter((n) => !n.read);
    if (tab === "bookings") return baseFiltered.filter((n) => Boolean(n.booking_code));
    return baseFiltered;
  }, [baseFiltered, tab]);

  const paged = tabFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(tabFiltered.length / PAGE_SIZE));

  const onTabChange = (key) => {
    setTab(key);
    setPage(1);
  };

  const shell = darkMode
    ? "bg-slate-900 border-slate-800 text-slate-200"
    : "bg-white border-slate-200/80 text-slate-900";

  return (
    <div className={`w-[380px] rounded-xl border overflow-hidden shadow-xl ${shell}`}>
      <div className={`px-4 py-3 border-b ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("notifications.title", "Notifications")}
            </h3>
            <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
              {t("notifications.subtitle", "Recent system activities")}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              darkMode ? "bg-sky-900/40 text-sky-400" : "bg-sky-100 text-sky-800"
            }`}
          >
            {tabFiltered.length}
          </span>
        </div>
      </div>

      <Tabs
        activeKey={tab}
        onChange={onTabChange}
        size="small"
        className="rms-notif-tabs px-2"
        items={[
          { key: "all", label: t("notifications.tabAll", "All") },
          { key: "unread", label: t("notifications.tabUnread", "Unread") },
          { key: "bookings", label: t("notifications.tabBookings", "Bookings") },
        ]}
      />

      <div className={`px-3 py-2 flex gap-2 border-b ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
        <input
          type="text"
          placeholder={t("notifications.searchPlaceholder", "Search notifications...")}
          value={search}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setPage(1);
          }}
          className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-sky-500/30 ${
            darkMode
              ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500"
              : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
          }`}
        />
        <select
          value={actionFilter}
          onChange={(e) => {
            onActionFilterChange(e.target.value);
            setPage(1);
          }}
          className={`text-xs px-2 py-1.5 rounded-lg border outline-none ${
            darkMode
              ? "bg-slate-800 border-slate-700 text-slate-200"
              : "bg-slate-50 border-slate-200 text-slate-900"
          }`}
        >
          {notifActionOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {paged.length === 0 ? (
          <div className="py-12 text-center px-4">
            <MdNotificationsNone
              className={`mx-auto mb-2 text-3xl ${darkMode ? "text-slate-600" : "text-slate-300"}`}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("notifications.empty", "No notifications found")}
            </p>
          </div>
        ) : (
          paged.map((n, index) => {
            const action = n.action?.toLowerCase();
            const iconBg =
              action === "created"
                ? darkMode ? "bg-emerald-900/30" : "bg-emerald-50"
                : action === "updated"
                  ? darkMode ? "bg-sky-900/30" : "bg-sky-50"
                  : action === "deleted"
                    ? darkMode ? "bg-red-900/30" : "bg-red-50"
                    : darkMode ? "bg-slate-800" : "bg-slate-50";
            return (
              <div
                key={n.id ?? `${tab}-${index}`}
                role={onNotificationClick ? "button" : undefined}
                tabIndex={onNotificationClick ? 0 : undefined}
                onClick={() => onNotificationClick?.(n)}
                onKeyDown={(e) => {
                  if (onNotificationClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onNotificationClick(n);
                  }
                }}
                className={`px-4 py-3 flex gap-3 border-b transition-colors ${
                  onNotificationClick ? "cursor-pointer" : ""
                } ${
                  darkMode
                    ? "border-slate-800 hover:bg-slate-800/60"
                    : "border-slate-50 hover:bg-slate-50"
                } ${!n.read ? (darkMode ? "bg-sky-950/30" : "bg-sky-50/80") : ""}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                  <span className="text-sm">{actionIcon(action)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                          {n.user_name ?? t("notifications.systemUser", "System")}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${actionStyle(action, darkMode)}`}>
                          {n.action ?? "system"}
                        </span>
                      </div>
                      <p className="text-xs mt-1 truncate text-slate-500 dark:text-slate-400">
                        {n.booking_code ?? "—"}
                        {n.status ? ` · ${n.status.replace(/_/g, " ")}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] whitespace-nowrap text-slate-400 dark:text-slate-500">
                      {n.created_at
                        ? dayjs(n.created_at).format("MMM D, HH:mm")
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {tabFiltered.length > 0 && (
        <div
          className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t ${
            darkMode ? "border-slate-800" : "border-slate-100"
          }`}
        >
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, tabFiltered.length)} {t("notifications.of", "of")} {tabFiltered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="text"
              size="small"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("button.previous", "Previous")}
            </Button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {page} / {totalPages}
            </span>
            <Button
              type="text"
              size="small"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("button.next", "Next")}
            </Button>
          </div>
          <Button
            type="link"
            danger
            size="small"
            onClick={() => {
              clearAll();
              setPage(1);
            }}
          >
            {t("notifications.clearAll", "Clear all")}
          </Button>
        </div>
      )}
    </div>
  );
}
