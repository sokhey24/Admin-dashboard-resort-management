import { useCallback, useEffect, useMemo, useState } from "react";
import { message, Button, Modal, Select } from "antd";
import { MdSearch, MdRefresh } from "react-icons/md";
import { request } from "../../util/request";
import { useCatalogStore, withBranchScope } from "../../store/CatalogStore";
import { useDarkMode } from "../../util/DarkModeContext";
import usePermission from "../../util/usePermission";
import { fmtDateTime } from "../../util/fmtDateTime";

const PAGE_SIZE = 10;

const TABS = [
  { key: "activity", label: "Activity bookings", path: "admin/activity-bookings" },
  { key: "service", label: "Service inquiries", path: "admin/service-inquiries" },
  { key: "contact", label: "Contact messages", path: "admin/contact-inquiries" },
];

const STATUS_STYLE = {
  pending: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  confirmed: { dot: "bg-green-500", light: "bg-green-50 text-green-700 ring-green-200", dark: "bg-green-900/40 text-green-400 ring-green-700" },
  cancelled: { dot: "bg-red-500", light: "bg-red-50 text-red-700 ring-red-200", dark: "bg-red-900/40 text-red-400 ring-red-700" },
};

function StatusBadge({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function summaryRow(tab, row) {
  if (tab === "activity") {
    return {
      title: row.activity_title,
      subtitle: `${row.booking_date} · ${row.guest_count} guests`,
      guest: row.guest_name,
    };
  }
  if (tab === "service") {
    return {
      title: row.service_title,
      subtitle: `${row.preferred_date} · ${row.resort_name}`,
      guest: row.guest_name,
    };
  }
  return {
    title: row.subject,
    subtitle: row.resort_name,
    guest: row.guest_name,
  };
}

export default function GuestInbox() {
  const dark = useDarkMode();
  const { canAny } = usePermission();
  const canUpdate = canAny("resort.guests.update", "admin.resorts.update", "resort.bookings.update");
  const selectedBranchId = useCatalogStore((s) => s.selectedBranchId);

  const [activeTab, setActiveTab] = useState("activity");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailStatus, setDetailStatus] = useState("pending");
  const [saving, setSaving] = useState(false);

  const tabConfig = useMemo(() => TABS.find((t) => t.key === activeTab) ?? TABS[0], [activeTab]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PAGE_SIZE),
    });
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);

    const base = `${tabConfig.path}?${params.toString()}`;
    const url = withBranchScope(base, activeTab === "activity" ? null : selectedBranchId);
    const res = await request(url, "get");

    if (res?.errors) {
      setRows([]);
      setError(res.errors.message ?? "Failed to load inquiries.");
      setLoading(false);
      return;
    }

    setRows(Array.isArray(res?.data) ? res.data : []);
    setMeta(res?.meta ?? { current_page: 1, last_page: 1, total: 0 });
    setLoading(false);
  }, [activeTab, page, search, statusFilter, selectedBranchId, tabConfig.path]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, statusFilter, selectedBranchId]);

  const openDetail = (row) => {
    setDetail(row);
    setDetailStatus(row.status ?? "pending");
  };

  const saveStatus = async () => {
    if (!detail || !canUpdate) return;
    setSaving(true);
    const path = `${tabConfig.path}/${detail.id}`;
    const res = await request(path, "patch", { status: detailStatus });
    setSaving(false);

    if (res?.errors) {
      message.error(res.errors.message ?? res.errors.status?.[0] ?? "Update failed");
      return;
    }

    message.success("Status updated");
    setDetail(null);
    load();
  };

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";

  return (
    <div className={`min-h-full rounded-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className={`text-[26px] font-bold ${titleCls}`}>Guest Inbox</h2>
        <Button onClick={load} className="inline-flex items-center gap-1.5" disabled={loading}>
          <MdRefresh size={16} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              activeTab === tab.key
                ? "bg-[#FF6B00] text-white border-[#FF6B00]"
                : dark
                  ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                  : "border-[#D9E2EC] text-[#486581] hover:bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`rounded-xl border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold ${titleCls}`}>{tabConfig.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? "bg-gray-700 text-gray-300" : "bg-[#F5F8FC] text-[#486581]"}`}>
              {meta.total ?? rows.length} records
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`text-xs rounded-lg border px-2 py-1.5 ${dark ? "bg-gray-700 border-gray-600 text-gray-100" : "border-[#D9E2EC]"}`}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guest or title…"
                className={`pl-9 pr-3 py-1.5 text-xs rounded-lg border w-52 ${dark ? "bg-gray-700 border-gray-600 text-gray-100" : "border-[#D9E2EC]"}`}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className={`py-16 text-center text-sm ${subText}`}>Loading…</p>
        ) : error ? (
          <p className="py-16 text-center text-sm text-red-500">{error}</p>
        ) : rows.length === 0 ? (
          <p className={`py-16 text-center text-sm ${subText}`}>No inquiries found.</p>
        ) : (
          <ul className={`divide-y ${dark ? "divide-gray-700" : "divide-gray-100"}`}>
            {rows.map((row) => {
              const s = summaryRow(activeTab, row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(row)}
                    className={`w-full text-left px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-colors ${
                      dark ? "hover:bg-gray-700/40" : "hover:bg-[#F5F8FC]"
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${titleCls}`}>{s.title}</p>
                      <p className={`text-xs ${subText}`}>{s.subtitle}</p>
                      <p className={`text-xs mt-1 ${subText}`}>{s.guest}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] ${subText}`}>{fmtDateTime(row.created_at)}</span>
                      <StatusBadge status={row.status} dark={dark} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !error && meta.last_page > 1 && (
          <div className={`px-6 py-3 border-t flex items-center justify-between text-xs ${subText} ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
            <span>Page {meta.current_page} of {meta.last_page}</span>
            <div className="flex gap-1">
              <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button size="small" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(detail)}
        title="Inquiry details"
        onCancel={() => setDetail(null)}
        footer={[
          <Button key="close" onClick={() => setDetail(null)}>Close</Button>,
          canUpdate ? (
            <Button key="save" type="primary" loading={saving} onClick={saveStatus}>
              Save status
            </Button>
          ) : null,
        ]}
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <p><strong>Guest:</strong> {detail.guest_name}</p>
            <p><strong>Email:</strong> {detail.guest_email}</p>
            <p><strong>Phone:</strong> {detail.guest_phone}</p>
            {detail.resort_name && <p><strong>Sanctuary:</strong> {detail.resort_name}</p>}
            {detail.message && (
              <p className="whitespace-pre-wrap"><strong>Message:</strong> {detail.message}</p>
            )}
            {detail.special_requests && (
              <p className="whitespace-pre-wrap"><strong>Notes:</strong> {detail.special_requests}</p>
            )}
            {canUpdate && (
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <Select
                  className="w-full"
                  value={detailStatus}
                  onChange={setDetailStatus}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "confirmed", label: "Confirmed" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
