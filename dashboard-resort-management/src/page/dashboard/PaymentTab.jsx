import { useEffect, useState, useMemo, useCallback } from "react";
import { Spin, Modal, Pagination, Dropdown, message } from "antd";
import { FaDollarSign, FaClock, FaMoneyBillWave, FaChevronDown, FaEye, FaPrint, FaFilePdf, FaUndo } from "react-icons/fa";
import { MdSearch, MdVisibility, MdPrint, MdPictureAsPdf, MdDownload } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { ProfileStore } from "../../store/ProfileStore";
import { request } from "../../util/request";
import { buildQS, DateFilter } from "../FilterData/Filter_data";
import PaymentDetailDrawer from "./PaymentDetailDrawer";
import { getMockPayments, getMockPayment, getMockPaymentStats } from "../../data/mockPayments";

// ── currency formatter ────────────────────────────────────────
export function fmtCurrency(v, currency = "USD") {
  const sym = currency === "USD" ? "$" : currency + " ";
  return sym + Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── status badge ──────────────────────────────────────────────
export function StatusBadge({ value, dark }) {
  const map = {
    paid:      { light: "bg-green-100 text-green-700",    dark: "bg-green-900/40 text-green-400" },
    pending:   { light: "bg-yellow-100 text-yellow-700",  dark: "bg-yellow-900/40 text-yellow-400" },
    partial:   { light: "bg-blue-100 text-blue-700",      dark: "bg-blue-900/40 text-blue-400" },
    refunded:  { light: "bg-orange-100 text-orange-700",  dark: "bg-orange-900/40 text-orange-400" },
    failed:    { light: "bg-red-100 text-red-700",        dark: "bg-red-900/40 text-red-400" },
    cancelled: { light: "bg-gray-100 text-gray-600",      dark: "bg-gray-700 text-gray-400" },
  };
  const s = map[value?.toLowerCase()] ?? map.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${dark ? s.dark : s.light}`}>
      {value ? value.charAt(0).toUpperCase() + value.slice(1) : "—"}
    </span>
  );
}

// ── stat card (reuse existing pattern) ───────────────────────
function StatCard({ title, value, icon, color, dark, loading }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{title}</span>
        <span className="text-lg" style={{ color }}>{icon}</span>
      </div>
      {loading
        ? <div className={`h-8 w-24 rounded animate-pulse ${dark ? "bg-gray-700" : "bg-[#F5F8FC]"}`} />
        : <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      }
    </div>
  );
}

// ── build action menu items (plain function — NOT a hook) ─────
function buildActionItems({ payment, perms, onView, onPrint, onPdf, onRefund }) {
  const status = payment?.status?.toLowerCase();
  const items = [];
  if (perms.canView)
    items.push({ key: "view", label: <span className="text-sm flex items-center gap-2"><MdVisibility size={14} /> View Payment</span>, onClick: () => onView(payment) });
  if (perms.canPrint) {
    const label = status === "refunded" ? "Print Refund Receipt"
      : status === "cancelled" ? "Print Cancellation"
      : status === "partial" ? "Print Partial Receipt"
      : "Print Receipt";
    items.push({ key: "print", label: <span className="text-sm flex items-center gap-2"><MdPrint size={14} /> {label}</span>, onClick: () => onPrint(payment) });
  }
  if (perms.canPdf) {
    const label = status === "refunded" ? "Generate Refund PDF"
      : status === "partial" ? "Generate Partial PDF"
      : "Generate PDF";
    items.push({ key: "pdf", label: <span className="text-sm flex items-center gap-2"><MdPictureAsPdf size={14} /> {label}</span>, onClick: () => onPdf(payment) });
  }
  if (perms.canRefund && (status === "paid" || status === "partial")) {
    items.push({ type: "divider", key: "div" });
    items.push({ key: "refund", label: <span className="text-sm flex items-center gap-2 text-red-500"><FaUndo size={12} /> Process Refund</span>, onClick: () => onRefund(payment) });
  }
  return items;
}

const PAGE_SIZE = 10;
const STATUSES  = ["all", "paid", "pending", "partial", "refunded", "failed", "cancelled"];

// ── main component ────────────────────────────────────────────
export default function PaymentTab({ dark: darkProp }) {
  const darkCtx = useDarkMode();
  const dark = darkProp ?? darkCtx;

  const { permission } = ProfileStore();
  const perms = {
    canView:   permission.includes("payments.view")   || permission.includes("admin.reports.view"),
    canPdf:    permission.includes("payments.pdf")    || permission.includes("admin.reports.view"),
    canPrint:  permission.includes("payments.print")  || permission.includes("admin.reports.view"),
    canRefund: permission.includes("payments.refund") || permission.includes("admin.reports.view"),
  };

  const [payments,      setPayments]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState({ date: null, month: null, year: null });
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [page,          setPage]          = useState(1);
  const [actionLoading, setActionLoading] = useState(null); // payment.id
  const [detailOpen,    setDetailOpen]    = useState(false);
  const [detailData,    setDetailData]    = useState(null);
  const [printTarget,   setPrintTarget]   = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [refundModal,   setRefundModal]   = useState(false);
  const [refundTarget,  setRefundTarget]  = useState(null);
  const [refundAmount,  setRefundAmount]  = useState("");
  const [refundReason,  setRefundReason]  = useState("");
  const [refundSaving,  setRefundSaving]  = useState(false);

  // ── load payments (use mock data for demo) ─────────────────
  const load = useCallback((f = filter) => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const mockData = getMockPayments({ status: statusFilter, search });
      setPayments(mockData);
      setLoading(false);
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);
  const handleFilter = (f) => { setFilter(f); load(f); };

  // ── filter + paginate ─────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter(p =>
      (statusFilter === "all" || p.status === statusFilter) &&
      (!q ||
        p.payment_id?.toLowerCase().includes(q) ||
        p.guest?.name?.toLowerCase().includes(q) ||
        p.source?.toLowerCase().includes(q) ||
        p.payment_method?.toLowerCase().includes(q) ||
        p.payment_reference?.toLowerCase().includes(q)
      )
    );
  }, [payments, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── summary stats (use mock stats helper) ───────────────────
  const stats = getMockPaymentStats(payments);
  const totalPaid    = stats.totalCollected;
  const totalPending = stats.totalPending;
  const totalRefund  = stats.totalRefunded;

  // ── action handlers (mock data) ───────────────────────────
  const handleView = async (payment) => {
    if (!perms.canView) { message.error("You do not have permission to view payments."); return; }
    setActionLoading(payment.id);
    // Simulate API delay
    setTimeout(() => {
      const mockDetail = getMockPayment(payment.id);
      setActionLoading(null);
      if (mockDetail) { setDetailData(mockDetail); setDetailOpen(true); }
      else message.error("Failed to load payment details.");
    }, 300);
  };

  const handlePrint = async (payment) => {
    if (!perms.canPrint) { message.error("You do not have permission to print receipts."); return; }
    setActionLoading(payment.id);
    // Simulate API delay
    setTimeout(() => {
      const mockDetail = getMockPayment(payment.id);
      setActionLoading(null);
      if (mockDetail) { setDetailData({ ...mockDetail, _printOnOpen: true }); setDetailOpen(true); }
      else message.error("Failed to prepare receipt.");
    }, 300);
  };

  const handlePdf = async (payment) => {
    if (!perms.canPdf) { message.error("You do not have permission to generate PDFs."); return; }
    setActionLoading(payment.id);
    const msgKey = `pdf-${payment.id}`;
    message.loading({ content: "Generating PDF…", key: msgKey, duration: 0 });
    // Simulate PDF generation
    setTimeout(() => {
      setActionLoading(null);
      message.success({ content: "Payment receipt generated successfully.", key: msgKey, duration: 3 });
      // In real app, this would open the PDF URL
      // For demo, show info message
      message.info({ content: `PDF would download: ${payment.payment_id}_Payment_Receipt.pdf`, key: msgKey, duration: 4 });
    }, 1000);
  };

  const handleRefundOpen = (payment) => {
    setRefundTarget(payment);
    setRefundAmount("");
    setRefundReason("");
    setRefundModal(true);
  };

  const handleRefundSubmit = async () => {
    const amt = parseFloat(refundAmount);
    const maxAmt = Number(refundTarget?.breakdown?.paid ?? refundTarget?.amount ?? 0);
    if (!amt || amt <= 0) { message.error("Enter a valid refund amount."); return; }
    if (amt > maxAmt) { message.error("Refund amount cannot exceed paid amount."); return; }
    setRefundSaving(true);
    // Simulate API call
    setTimeout(() => {
      setRefundSaving(false);
      message.success("Refund processed successfully. (Demo mode)");
      setRefundModal(false);
      setRefundTarget(null);
      load();
    }, 1000);
  };

  // ── style tokens (match existing dashboard pattern) ───────
  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr   = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText   = dark ? "text-gray-400"                 : "text-[#486581]";
  const thead     = dark ? "bg-gray-700/60"                : "bg-[#F5F8FC]";
  const thText    = dark ? "text-gray-400"                 : "text-[#486581]";
  const divider   = dark ? "divide-gray-700"               : "divide-[#D9E2EC]";
  const rowHover  = dark ? "hover:bg-gray-700/40"          : "hover:bg-[#F5F8FC]";
  const cellText  = dark ? "text-gray-300"                 : "text-[#486581]";
  const filterBg  = dark ? "bg-gray-700"                   : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-gray-400 hover:text-gray-200" : "text-[#486581] hover:text-[#102A43]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow"  : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-52"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-52 placeholder:text-[#829AB1]";
  const inputCls  = dark
    ? "w-full px-3 py-2 text-sm border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
    : "w-full px-3 py-2 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30";

  return (
    <Spin spinning={loading}>
      <DateFilter filter={filter} onChange={handleFilter} dark={dark} />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Collected" value={fmtCurrency(totalPaid)}    icon={<FaDollarSign />}    color="#52c41a" dark={dark} loading={loading} />
        <StatCard title="Pending"         value={fmtCurrency(totalPending)} icon={<FaClock />}         color="#faad14" dark={dark} loading={loading} />
        <StatCard title="Refunded"        value={fmtCurrency(totalRefund)}  icon={<FaMoneyBillWave />} color="#ff4d4f" dark={dark} loading={loading} />
      </div>

      {/* ── Table Card ── */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>

        {/* Header */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Payment Records</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
              dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"
            }`}>{filtered.length} records</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter pills */}
            <div className={`flex gap-1 rounded-lg p-1 overflow-x-auto ${filterBg}`}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === s ? filterAct : filterBtn
                  }`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search ID, guest, method…" className={searchCls} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["Payment ID","Guest","Source","Reference","Amount","Method","Date","Status","Action"].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${thText}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`py-16 text-center text-sm ${subText}`}>
                    {loading ? "Loading…" : "No payment records found."}
                  </td>
                </tr>
              ) : paged.map(p => {
                const ref     = p.reference;
                const refCode = p.source === "resort" ? (ref?.booking_code ?? "—") : (ref?.order_code ?? "—");
                const isLoading = actionLoading === p.id;

                const menuItems = buildActionItems({
                  payment: p, perms,
                  onView: handleView,
                  onPrint: handlePrint,
                  onPdf: handlePdf,
                  onRefund: handleRefundOpen,
                });

                return (
                  <tr key={p.id} className={`transition-colors ${rowHover}`}>
                    <td className={`px-4 py-3 text-sm font-semibold ${titleCls}`}>{p.payment_id ?? `PAY-${p.id}`}</td>
                    <td className={`px-4 py-3 text-sm ${cellText}`}>{p.guest?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.source === "resort"
                          ? dark ? "bg-blue-900/40 text-blue-400" : "bg-blue-100 text-blue-700"
                          : dark ? "bg-orange-900/40 text-orange-400" : "bg-orange-100 text-orange-700"
                      }`}>
                        {p.source === "resort" ? "Resort" : "Restaurant"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${dark ? "text-blue-400" : "text-blue-600"}`}>{refCode}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${dark ? "text-green-400" : "text-green-700"}`}>
                      {fmtCurrency(p.amount, p.currency)}
                    </td>
                    <td className={`px-4 py-3 text-sm ${cellText}`}>{p.payment_method ?? "—"}</td>
                    <td className={`px-4 py-3 text-sm whitespace-nowrap ${cellText}`}>
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge value={p.status} dark={dark} /></td>
                    <td className="px-4 py-3">
                      {menuItems.length > 0 ? (
                        <Dropdown
                          menu={{ items: menuItems }}
                          trigger={["click"]}
                          placement="bottomRight"
                          disabled={isLoading}
                        >
                          <button
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                              dark
                                ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                                : "bg-[#F5F8FC] border-[#D9E2EC] text-[#486581] hover:bg-[#E8EEF4]"
                            }`}
                          >
                            {isLoading ? "Loading…" : "Actions"}
                            <FaChevronDown size={10} />
                          </button>
                        </Dropdown>
                      ) : (
                        <span className={`text-xs ${subText}`}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onChange={setPage}
            size="small"
            showSizeChanger={false}
          />
        </div>
      </div>

      {/* ── Payment Detail Drawer ── */}
      <PaymentDetailDrawer
        open={detailOpen}
        payment={detailData}
        dark={dark}
        perms={perms}
        onClose={() => { setDetailOpen(false); setDetailData(null); }}
        onPdf={handlePdf}
        onPrint={handlePrint}
        actionLoading={actionLoading}
      />

      {/* ── Refund Modal ── */}
      <Modal
        title={<span className="font-semibold">Process Refund — {refundTarget?.payment_id}</span>}
        open={refundModal}
        onCancel={() => { setRefundModal(false); setRefundTarget(null); }}
        onOk={handleRefundSubmit}
        confirmLoading={refundSaving}
        okText="Confirm Refund"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#486581]">
              Refund Amount (max: {fmtCurrency(refundTarget?.breakdown?.paid ?? refundTarget?.amount)})
            </label>
            <input
              type="number" min="0.01" step="0.01"
              max={refundTarget?.breakdown?.paid ?? refundTarget?.amount ?? 0}
              value={refundAmount}
              onChange={e => setRefundAmount(e.target.value)}
              className={inputCls}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#486581]">Reason (optional)</label>
            <textarea rows={3} value={refundReason} onChange={e => setRefundReason(e.target.value)}
              className={inputCls} placeholder="Reason for refund…" />
          </div>
        </div>
      </Modal>
    </Spin>
  );
}


