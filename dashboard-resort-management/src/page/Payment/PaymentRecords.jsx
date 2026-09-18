/**
 * PaymentRecords.jsx
 * Standalone Payment Records page — full production implementation.
 *
 * Features:
 *  - Payment Records table (9 columns as specified)
 *  - Status filter pills + search
 *  - Summary stat cards (collected / pending / refunded)
 *  - Date filter
 *  - ActionDropdown per row (permission-gated, status-aware)
 *  - PaymentDetailModal (View / Print / PDF / Download)
 *  - Pagination
 *  - Empty state, loading state, error state
 *  - Dark theme support (inherits from DarkModeContext)
 *  - Print workflow: Print → PaymentReceiptPDF via window.print()
 *  - PDF workflow: backend generates & stores PDF, frontend downloads
 *  - Audit log: logged on backend per action
 */

import { useState, useEffect } from "react";
import { Spin, Button, Select, message } from "antd";
import {
  FaDollarSign, FaClock, FaMoneyBillWave,
} from "react-icons/fa";
import { MdSearch, MdVisibility } from "react-icons/md";
import { useDarkMode }   from "../../util/DarkModeContext";
import { request }       from "../../util/request";
import { DateFilter } from "../FilterData/Filter_data";
import usePermission      from "../../util/usePermission";
import PaymentDetailModal, { ActionDropdown } from "./PaymentDetailModal";
import {
  PAY_PAGE_SIZE, PAY_STATUSES, PAY_METHODS,
  fmtAmt, methodLabel, roomSummary, bookingCode, orderCode, tableSummary, venueName, sourceLabel, buildPaymentQuery,
  asList, paginationFrom,
} from "./paymentHelpers";

function StatCard({ title, value, icon, color, dark, loading }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{title}</span>
        <span className="text-lg" style={{ color }}>{icon}</span>
      </div>
      {loading
        ? <div className={`h-8 w-20 rounded animate-pulse ${dark ? "bg-gray-700" : "bg-[#F5F8FC]"}`} />
        : <div className="text-xl font-bold" style={{ color }}>{value}</div>
      }
    </div>
  );
}

const STATUS_MAP = {
  paid:       { light: "bg-green-100 text-green-700",    dark: "bg-green-900/40 text-green-400" },
  pending:    { light: "bg-yellow-100 text-yellow-700",  dark: "bg-yellow-900/40 text-yellow-400" },
  partial:    { light: "bg-blue-100 text-blue-700",      dark: "bg-blue-900/40 text-blue-400" },
  refunded:   { light: "bg-orange-100 text-orange-700",  dark: "bg-orange-900/40 text-orange-400" },
  cancelled:  { light: "bg-gray-100 text-gray-600",      dark: "bg-gray-700 text-gray-400" },
  failed:     { light: "bg-red-100 text-red-700",        dark: "bg-red-900/40 text-red-400" },
};

export function StatusBadge({ value, dark }) {
  const s = STATUS_MAP[value?.toLowerCase()] ?? STATUS_MAP.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dark ? s.dark : s.light}`}>
      {value?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "—"}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function PaymentListPage({ source = "resort", title = "Payment", embedded = false }) {
  const dark = useDarkMode();
  const { canAny }  = usePermission();
  const isRestaurant = source === "restaurant";
  const isAll = source === "all";

  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [filter,       setFilter]       = useState({ date: null, month: null, year: null });
  const [searchInput,  setSearchInput]  = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("");
  const [resortId,     setResortId]     = useState();
  const [resorts,      setResorts]      = useState([]);
  const [page,         setPage]         = useState(1);
  const [perPage]      = useState(PAY_PAGE_SIZE);
  const [meta,         setMeta]         = useState({ current: 1, last: 1, total: 0, from: 0, to: 0 });
  const [stats,        setStats]        = useState({ collected: 0, pending: 0, refunded: 0 });
  const [detailId,     setDetailId]     = useState(null);
  const [detailData,   setDetailData]   = useState(null);
  const [autoPrint,    setAutoPrint]    = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = () => {
    setLoading(true);
    setError(null);
    const qs = buildPaymentQuery({
      page, perPage, search, status: statusFilter, method: methodFilter, resortId, filter, source,
    });
    return request(`admin/payments?${qs}`, "get").then((res) => {
      if (res?.errors) {
        setPayments([]);
        setError(res.errors.message ?? "Unable to load payments.");
      } else {
        setPayments(asList(res));
        setMeta(paginationFrom(res));
        if (res?.stats) setStats(res.stats);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [page, perPage, search, statusFilter, methodFilter, resortId, filter, source]);

  useEffect(() => {
    request("admin/resorts", "get").then((res) => { if (!res?.errors) setResorts(asList(res)); });
  }, []);

  const handleFilter = (f) => { setFilter(f); setPage(1); };

  const totalCollected = stats.collected;
  const totalPending   = stats.pending;
  const totalRefunded  = stats.refunded;
  const canView = canAny("payments.view", "resort.payments.view", "restaurant.billing.view", "admin.reports.view");

  const openView  = (pay, mode) => {
    setAutoPrint(mode === "print");
    setDetailData(null);
    setDetailId(pay.id);
    request(`admin/payments/${pay.id}`, "get").then((res) => {
      if (res?.errors) {
        message.error(res.errors.message ?? "Unable to load payment.");
        return;
      }
      setDetailData(res?.data ?? pay);
    });
  };
  const closeView = () => { setDetailId(null); setDetailData(null); setAutoPrint(false); };

  // ── Style tokens ──────────────────────────────────────────
  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr   = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText   = dark ? "text-gray-400"                 : "text-[#486581]";
  const thead     = dark ? "bg-gray-700/60"                : "bg-[#F5F8FC]";
  const thText    = dark ? "text-gray-400"                 : "text-[#486581]";
  const tbody     = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-[#D9E2EC]";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-[#F5F8FC]";
  const cellText  = dark ? "text-gray-300"                 : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]"                : "text-[#829AB1]";
  const divider   = dark ? "divide-gray-700"               : "divide-[#D9E2EC]";
  const filterBg  = dark ? "bg-gray-700"                   : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-gray-400 hover:text-gray-200" : "text-[#486581] hover:text-[#102A43]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow"  : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-52"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-52 placeholder:text-[#829AB1]";
  const colCount = isAll ? 14 : 13;
  const emptyCopy = isRestaurant
    ? "No restaurant payment records found."
    : isAll
      ? "No payment records found."
      : "No resort payment records found.";
  const searchPlaceholder = isRestaurant
    ? "Search ID, guest, order…"
    : isAll
      ? "Search ID, guest, booking, order…"
      : "Search ID, guest, booking…";
  const tableTitle = isRestaurant ? "Restaurant payments" : isAll ? "All payments" : "Resort payments";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold text-[#486581] hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  const wrapCls = embedded
    ? ""
    : `min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`;

  return (
    <div className={wrapCls} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      {!embedded && <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>{title}</h2>}
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Collected"
          value={fmtAmt(totalCollected)}
          icon={<FaDollarSign />}
          color="#52c41a"
          dark={dark}
          loading={loading}
        />
        <StatCard
          title="Pending Amount"
          value={fmtAmt(totalPending)}
          icon={<FaClock />}
          color="#faad14"
          dark={dark}
          loading={loading}
        />
        <StatCard
          title="Total Refunded"
          value={fmtAmt(totalRefunded)}
          icon={<FaMoneyBillWave />}
          color="#ff4d4f"
          dark={dark}
          loading={loading}
        />
      </div>

      {/* ── Date Filter ── */}
      <DateFilter filter={filter} onChange={handleFilter} dark={dark} />

      {/* ── Payment Records Card ── */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        {/* Table Header */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>{tableTitle}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
              dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"
            }`}>{meta.total} records</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              allowClear
              placeholder="Resort"
              value={resortId}
              onChange={(v) => { setResortId(v); setPage(1); }}
              className="min-w-[160px]"
              options={resorts.map((r) => ({ value: r.id, label: r.name }))}
            />
            <Select
              placeholder="Method"
              value={methodFilter || ""}
              onChange={(v) => { setMethodFilter(v); setPage(1); }}
              className="min-w-[150px]"
              options={PAY_METHODS}
            />
            <div className={`flex gap-1 rounded-lg p-1 overflow-x-auto ${filterBg}`}>
              {PAY_STATUSES.map(s => (
                <Button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === s ? filterAct : filterBtn
                  }`}
                >
                  {s === "all" ? "All" : s.replace(/\b\w/g, c => c.toUpperCase())}
                </Button>
              ))}
            </div>
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className={searchCls}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-10 ${thText}`}>#</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Payment ID</th>
                {isAll && <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Source</th>}
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>{isRestaurant ? "Order ID" : isAll ? "Booking / Order" : "Booking ID"}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Guest</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>{isRestaurant ? "Restaurant" : "Resort"}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>{isRestaurant ? "Table" : isAll ? "Room / Table" : "Room(s)"}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Reference</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Amount</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Method</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Status</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Date</th>
                {/* <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Txn ID</th> */}
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {/* Loading */}
              {loading && (
                <tr>
                    <td colSpan={colCount} className={`py-16 text-center ${subText}`}>
                    <Spin size="large" />
                    <p className="mt-3 text-sm">Loading payment records…</p>
                  </td>
                </tr>
              )}

              {/* Error */}
              {!loading && error && (
                <tr>
                    <td colSpan={colCount} className="py-16 text-center">
                    <div className="text-red-500 text-sm mb-2">⚠ {error}</div>
                    <Button onClick={() => load()} className={`text-xs ${dark ? "text-blue-400" : "text-blue-600"}`}>
                      Retry
                    </Button>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!loading && !error && payments.length === 0 && (
                <tr>
                  <td colSpan={colCount} className={`py-16 text-center text-sm ${subText}`}>
                    {emptyCopy}
                  </td>
                </tr>
              )}

              {!loading && !error && payments.map((p, idx) => (
                <tr key={p.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-3 text-sm ${cellMuted}`}>
                    {(meta.from || ((page - 1) * PAY_PAGE_SIZE + 1)) + idx}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium font-mono ${titleCls}`}>
                    {p.payment_id ?? `PAY-${p.id}`}
                  </td>
                  {isAll && (
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.source === "restaurant"
                          ? dark ? "bg-orange-900/40 text-orange-400" : "bg-orange-50 text-orange-700"
                          : dark ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-700"
                      }`}>{sourceLabel(p)}</span>
                    </td>
                  )}
                  <td className={`px-4 py-3 text-sm font-mono ${cellText}`}>
                    {p.source === "restaurant" ? orderCode(p) : bookingCode(p)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${cellText}`}>{p.guest?.name ?? "—"}</td>
                  <td className={`px-4 py-3 text-sm ${cellText}`}>{venueName(p)}</td>
                  <td className={`px-4 py-3 text-sm ${cellText}`}>
                    {p.source === "restaurant" ? tableSummary(p) : roomSummary(p)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-mono ${cellText}`}>{p.payment_reference ?? "—"}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${dark ? "text-green-400" : "text-green-700"}`}>
                    {fmtAmt(p.amount)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${cellText}`}>{methodLabel(p.payment_method ?? p.method)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge value={p.status} dark={dark} />
                  </td>
                  <td className={`px-4 py-3 text-sm whitespace-nowrap ${cellText}`}>
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleDateString("en-US", {
                          day: "2-digit", month: "short", year: "numeric",
                        })
                      : "—"}
                  </td>
                  {/* <td className={`px-4 py-3 text-xs font-mono ${cellMuted}`}>{p.transaction_id ?? "—"}</td> */}
                  <td className="px-4 py-3 text-center">
                    {canView ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          onClick={() => openView(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            dark
                              ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                        >
                          <MdVisibility size={14} /> View
                        </Button>
                        <ActionDropdown payment={p} dark={dark} onView={openView} onRefunded={load} />
                      </div>
                    ) : (
                      <span className={`text-xs ${subText}`}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && meta.total > 0 && (
          <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
            <span>
              Page {meta.current} of {meta.last} · {meta.total} record{meta.total !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={pageBtn}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(meta.last, 7) }, (_, i) => i + 1).map(pg => (
                <Button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === pg
                      ? "bg-[#FF6B00] text-white"
                      : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"
                  }`}
                >
                  {pg}
                </Button>
              ))}
              <Button
                onClick={() => setPage(p => Math.min(meta.last, p + 1))}
                disabled={page >= meta.last}
                className={pageBtn}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {detailId && (
        <PaymentDetailModal
          payment={detailData}
          open={!!detailId}
          onClose={closeView}
          dark={dark}
          autoPrint={autoPrint}
        />
      )}
    </div>
  );
}
