import { useEffect, useState, useMemo } from "react";
import { Tabs, Spin, Modal, Form, Select, message, DatePicker, Button, Input, Pagination } from "antd";
import dayjs from "dayjs";
import {
  FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle,
  FaUser, FaUsers, FaDollarSign,
  FaChartBar,
  FaHome, FaUtensils,
  FaConciergeBell, FaLayerGroup, FaChartLine,
  FaBed, FaMoneyBillWave, FaClipboardList,
} from "react-icons/fa";
import { MdTableRestaurant, MdOutlineBeachAccess } from "react-icons/md";
import { BiSolidDashboard } from "react-icons/bi";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { MdEdit, MdDelete, MdSearch } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { request } from "../../util/request";
import ActionButtons from "../../components/ActionButtons";
import AdminMonthlyRevenueChart from "../Chart_Data/AdminMonthlyRevenueChart";
import RevenueStatCard from "../../components/dashboard/RevenueStatCard";
import StatCardsGroup from "../../components/dashboard/StatCardsGroup";
import DashboardStatCard from "../../components/dashboard/DashboardStatCard";
import RecentActivityFeed from "../../components/dashboard/RecentActivityFeed";
import { useRevenuePeriodComparison } from "../../hooks/useRevenuePeriodComparison";
import useRole from "../../util/useRole";
import { buildQS, DateFilter, SearchBar } from "../FilterData/Filter_data";
import PaymentTab from "../Payment/PaymentTab";
import { fmtDateTime } from "../../util/fmtDateTime";
import { useBookingStore } from "../../store/BookingStore";
import { useCatalogStore } from "../../store/CatalogStore";
import { useBranchStore } from "../../store/useBranchStore";
import LineChartPerformance from "../Chart_Data/LineChartPerformance";
import AreaChartAnalaysisPerformance from "../Chart_Data/AreaChartAnalaysisPerformance";
import { BsShopWindow } from "react-icons/bs";
import Chart_data_resort from "../Chart_Data/Chart_data_resort";
import ChartCircleRestaurant from "../Chart_Data/Chart_cirlce";
import ListCardRecently from "../customer/ListCardRecently";
import NotificationCard from "../ManagerSystem/NotificationCard";




const { Option } = Select;

// ── Shared UI helpers ──────────────────────────────────────────
function Card({ title, children, dark, className = "" }) {
  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
      } ${className}`}
    >
      {title && (
        <div
          className={`px-5 py-3 border-b text-sm font-semibold ${
            dark ? "border-slate-800 text-slate-100" : "border-slate-100 text-slate-900"
          }`}
        >
          {title}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
const orderOverviewData = [
  { month: "Jan", orders: 120 },
  { month: "Feb", orders: 145 },
  { month: "Mar", orders: 168 },
  { month: "Apr", orders: 152 },
  { month: "May", orders: 190 },
  { month: "Jun", orders: 215 },
  { month: "Jul", orders: 198 },
  { month: "Aug", orders: 235 },
];


const TABLE_PAGE_SIZE = 10;
function SimpleTable({ columns, data, dark, pageSize = TABLE_PAGE_SIZE, searchKeys = [] }) {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      searchKeys.some(k => String(row[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, searchKeys]);

  // reset to page 1 when data or search changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [search, data.length]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const th = `px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? "text-[#829AB1] bg-gray-700/60" : "text-[#486581] bg-[#F5F8FC]"}`;
  const td = `px-4 py-3 text-sm whitespace-nowrap ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const tr = `border-b ${dark ? "border-gray-700 hover:bg-gray-700/40" : "border-[#D9E2EC] hover:bg-[#F5F8FC]"} transition-colors`;

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="px-1 pb-3">
          <SearchBar value={search} onChange={setSearch} dark={dark} placeholder="Search…" />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead><tr>{columns.map(c => <th key={c.key} className={th}>{c.title}</th>)}</tr></thead>
          <tbody>
            {paged.length === 0
              ? <tr><td colSpan={columns.length} className={`text-center py-8 text-sm ${dark ? "text-[#829AB1]" : "text-gray-400"}`}>No data</td></tr>
              : paged.map((row, i) => (
                <tr key={row.key ?? row.id ?? i} className={tr}>
                  {columns.map(c => (
                    <td key={c.key} className={td}>
                      {c.render ? c.render(row[c.key], row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      {filtered.length > pageSize && (
        <div className={`flex items-center justify-between pt-3 mt-1 border-t ${dark ? "border-gray-700" : "border-gray-100"}`}>
          <span className={`text-xs ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={filtered.length}
            onChange={setPage}
            size="small"
            showSizeChanger={false}
          />
        </div>
      )}
      {filtered.length <= pageSize && filtered.length > 0 && (
        <div className={`pt-2 mt-1 border-t text-xs ${dark ? "border-gray-700 text-[#829AB1]" : "border-gray-100 text-gray-400"}`}>
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ value, dark }) {
  const map = {
    confirmed:  { light: "bg-green-100 text-green-700",   dark: "bg-green-900/40 text-green-400" },
    pending:    { light: "bg-yellow-100 text-yellow-700",  dark: "bg-yellow-900/40 text-yellow-400" },
    cancelled:  { light: "bg-red-100 text-red-700",        dark: "bg-red-900/40 text-red-400" },
    completed:  { light: "bg-blue-100 text-blue-700",      dark: "bg-blue-900/40 text-blue-400" },
    checked_in: { light: "bg-teal-100 text-teal-700",      dark: "bg-teal-900/40 text-teal-400" },
    checked_out:{ light: "bg-purple-100 text-purple-700",  dark: "bg-purple-900/40 text-purple-400" },
    paid:       { light: "bg-green-100 text-green-700",    dark: "bg-green-900/40 text-green-400" },
    failed:     { light: "bg-red-100 text-red-700",        dark: "bg-red-900/40 text-red-400" },
    refunded:   { light: "bg-orange-100 text-orange-700",  dark: "bg-orange-900/40 text-orange-400" },
  };
  const s = map[value?.toLowerCase()] ?? map.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dark ? s.dark : s.light}`}>
      {value?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

function DarkTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${dark ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-[#D9E2EC] text-[#486581]"}`}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: ${Number(p.value)?.toLocaleString()}</p>
      ))}
    </div>
  );
}

const PIE_COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2"];

// ── Overview Tab (real data) ───────────────────────────────────
function OverviewTab({ dark }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState({ date: null, month: null, year: null });
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const { isAdmin } = useRole();
  const load = (f = filter) => {
    setLoading(true);
    const qs = buildQS({ ...f, branchId: selectedBranchId });
    request(`admin/dashboard${qs}`, "get")
      .then(res => {
        if (res?.success) {
          setData(res.data);
        } else {
          setError(res?.errors?.message ?? "Failed to load dashboard data");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedBranchId]);

  const handleFilter = (f) => { setFilter(f); load(f); };

  const stats     = data?.statistics ?? {};
  const currentRevenue = stats.total_revenue ?? 0;
  const {
    comparison,
    comparisonLoading,
    comparisonError,
    periodLabel,
    canCompare,
  } = useRevenuePeriodComparison(filter, selectedBranchId, currentRevenue);

  const chartYear = filter.year || dayjs().year();

  if (error) return (
    <div className={`rounded-xl p-8 text-center ${dark ? "bg-gray-800 text-red-400" : "bg-white text-red-500"}`}>
      {error}
    </div>
  );

  return (
    <Spin spinning={loading}>
      <DateFilter filter={filter} onChange={handleFilter} dark={dark} />
      <StatCardsGroup
        stats={stats}
        dark={dark}
        loading={loading}
        currentRevenue={currentRevenue}
        comparison={comparison}
        comparisonLoading={comparisonLoading}
        comparisonError={comparisonError}
        periodLabel={periodLabel}
        canCompare={canCompare}
      />

      {/* ── Resort Management Section ── */}
      <div className={`rounded-xl border mb-4 overflow-hidden ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
        <LineChartPerformance
          monthlyPerformance={data?.monthly_performance ?? []}
          loading={loading}
          year={chartYear}
        />
      </div>

      <div>
        <NotificationCard/>
      </div>

      {/* ── Recent Bookings + Recent Activity ── */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <ListCardRecently bookings={data?.recent_bookings} />
          <RecentActivityFeed activities={data?.recent_activities ?? []} dark={dark} />
        </div>
      )}
      
    </Spin>
  );
}

const BOOKING_STATUSES = ["all", "pending", "confirmed", "checked_in", "checked_out", "cancelled", "completed"];
const RES_PAGE_SIZE = 8;

// ── Reservation Tab ────────────────────────────────────────────
function ReservationTab({ dark }) {
  const [stats,    setStats]    = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState({ date: null, month: null, year: null });
  const [search,   setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,     setPage]     = useState(1);
  const [form] = Form.useForm();

  const globalBookings = useBookingStore(s => s.bookings);
  const { updateBooking } = useBookingStore();

  // Merge global store updates into local state reactively
  useEffect(() => {
    if (!globalBookings.length) return;
    setBookings(prev =>
      prev.map(b => {
        const g = globalBookings.find(x => x.id === b.id);
        return g ? { ...b, ...g } : b;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalBookings]);

  const handleCheckout = async (b) => {
    const res = await request(`admin/bookings/${b.id}`, "put", { status: "checked_out" });
    if (!res?.errors && res?.data) {
      updateBooking(res.data);
      setBookings(prev => prev.map(x => x.id === res.data.id ? { ...x, ...res.data } : x));
      message.success("Checked out successfully");
    } else {
      message.error("Failed to check out");
    }
  };

  const load = async (f = filter) => {
    setLoading(true);
    const qs = buildQS({ ...f, branchId: selectedBranchId });
    const res = await request(`admin/bookings${qs}`, "get");
    if (res?.data) {
      setBookings(res.data);
      setStats({
        total:     res.data.length,
        confirmed: res.data.filter(b => b.status === "confirmed").length,
        pending:   res.data.filter(b => b.status === "pending").length,
        cancelled: res.data.filter(b => b.status === "cancelled").length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedBranchId]);

  const handleFilter = (f) => { setFilter(f); load(f); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(b =>
      (statusFilter === "all" || b.status === statusFilter) &&
      (!q || b.booking_code?.toLowerCase().includes(q) ||
             b.user?.name?.toLowerCase().includes(q) ||
             b.check_in?.toLowerCase().includes(q) ||
             b.check_out?.toLowerCase().includes(q))
    );
  }, [bookings, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / RES_PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * RES_PAGE_SIZE, page * RES_PAGE_SIZE);

  const openEdit = (r) => { setEditing(r); form.setFieldsValue({ status: r.status }); setModal(true); };
  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Booking",
      content: "Are you sure you want to delete this booking? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        const res = await request(`admin/bookings/${id}`, "delete");
        if (!res?.errors) { message.success("Booking deleted successfully"); load(); }
        else message.error("Failed to delete booking");
      },
    });
  };
  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/bookings/${editing.id}`, "put", values);
    setSaving(false);
    if (!res?.errors) {
      if (res?.data) updateBooking(res.data);
      message.success("Updated"); setModal(false); load();
    } else message.error("Failed to update");
  };

  // style tokens (mirrors Employees)
  const card     = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr  = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText  = dark ? "text-gray-400"                 : "text-[#486581]";
  const thead    = dark ? "bg-gray-700/60"                : "bg-[#F5F8FC]";
  const thText   = dark ? "text-gray-400"                 : "text-[#486581]";
  const tbody    = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-[#D9E2EC]";
  const rowHover = dark ? "hover:bg-gray-700/50"          : "hover:bg-[#F5F8FC]";
  const cellText = dark ? "text-gray-300"                 : "text-[#486581]";
  const cellMuted= dark ? "text-[#829AB1]"                 : "text-[#829AB1]";
  const divider  = dark ? "divide-gray-700"               : "divide-[#D9E2EC]";
  const filterBg = dark ? "bg-gray-700"                   : "bg-[#F5F8FC]";
  const filterBtn= dark ? "text-gray-400 hover:text-gray-200" : "text-[#486581] hover:text-[#102A43]";
  const filterAct= dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchCls= dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48 placeholder:text-[#829AB1]";
  const pageBtn  = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold text-[#486581] hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <Spin spinning={loading}>
      <DateFilter filter={filter} onChange={handleFilter} dark={dark} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <DashboardStatCard title="Total Reservations" value={stats.total}     icon={<FaCalendarAlt />}  color="#1677ff" dark={dark} />
        <DashboardStatCard title="Confirmed"          value={stats.confirmed} icon={<FaCheckCircle />}  color="#52c41a" dark={dark} />
        <DashboardStatCard title="Pending"            value={stats.pending}   icon={<FaClock />}        color="#faad14" dark={dark} />
        <DashboardStatCard title="Cancelled"          value={stats.cancelled} icon={<FaTimesCircle />}  color="#ff4d4f" dark={dark} />
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Recent Reservations</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
              dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"
            }`}>{filtered.length} bookings</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter pills */}
            <div className={`flex gap-1 rounded-lg p-1 overflow-x-auto ${filterBg}`}>
              {BOOKING_STATUSES.map(s => (
                <Button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === s ? filterAct : filterBtn
                  }`}>
                  {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </Button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…" className={searchCls} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No.</th>
                {/* <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Booking</th> */}
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Guest</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Room</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Check-in</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Check-out</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Status</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>No reservations found</td></tr>
              ) : pageItems.map((b, idx) => (
                <tr key={b.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * RES_PAGE_SIZE + idx + 1}</td>
                  {/* <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{b.booking_code ?? `BK-${b.id}`}</td> */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 ${
                        dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"
                      }`}>
                        {b.user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${titleCls}`}>{b.user?.name ?? "—"}</p>
                        <p className={`text-xs truncate ${subText}`}>{b.user?.email ?? ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{b.rooms?.[0]?.room_number ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{fmtDateTime(b.check_in)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{fmtDateTime(b.check_out)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge value={b.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => openEdit(b)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
                        }`}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button onClick={() => handleDelete(b.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
                        }`}>
                        <MdDelete size={14} /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"
                }`}>{p}</Button>
            ))}
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>

      <Modal title="Edit Booking" open={modal} onOk={handleSave} onCancel={() => setModal(false)} confirmLoading={saving} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="checked_in">Checked In</Option>
              <Option value="checked_out">Checked Out</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
}

// ── Guest Tab ──────────────────────────────────────────────────
function GuestTab({ dark }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ date: null, month: null, year: null });

  const load = (f = filter) => {
    setLoading(true);
    const qs = buildQS(f);
    request(`admin/users${qs}`, "get")
      .then(res => { if (res?.data) setUsers(res.data); })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleFilter = (f) => { setFilter(f); load(f); };

  const columns = [
    {
      key: "name",
      title: "User",
      render: (v, row) => (
        <div className="flex items-center gap-3">
          {row.profile_image_url
            ? <img src={row.profile_image_url} alt={v} className="w-8 h-8 rounded-full object-cover border border-[#D9E2EC]" />
            : <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${ dark ? "bg-blue-700" : "bg-[#FF6B00]"}`}>
                {v?.charAt(0).toUpperCase()}
              </div>
          }
          <div>
            <div className={`font-medium text-sm ${dark ? "text-gray-200" : "text-[#102A43]"}`}>{v}</div>
            <div className={`text-xs ${dark ? "text-[#829AB1]" : "text-gray-400"}`}>{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: "phone",  title: "Phone",  render: v => v ?? "—" },
    { key: "gender", title: "Gender", render: v => v ? v.charAt(0).toUpperCase() + v.slice(1) : "—" },
    {
      key: "roles",
      title: "Role",
      render: (_, row) => row.roles?.length
        ? row.roles.map(r => (
            <span key={r.id} className={`px-2 py-0.5 rounded-full text-xs font-medium mr-1 ${
              dark ? "bg-blue-900/40 text-blue-400" : "bg-blue-100 text-blue-700"
            }`}>{r.name}</span>
          ))
        : <span className={`text-xs ${dark ? "text-[#829AB1]" : "text-gray-400"}`}>No role</span>,
    },
    { key: "status", title: "Status", render: v => <StatusBadge value={v} dark={dark} /> },
    { key: "created_at", title: "Joined", render: v => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  return (
    <Spin spinning={loading}>
      <DateFilter filter={filter} onChange={handleFilter} dark={dark} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DashboardStatCard title="Total Users"    value={users.length}                                     icon={<FaUsers />} color="#1677ff" dark={dark} />
        <DashboardStatCard title="Active Users"   value={users.filter(u => u.status === "active").length}   icon={<FaUser />}  color="#52c41a" dark={dark} />
        <DashboardStatCard title="Inactive Users" value={users.filter(u => u.status === "inactive").length} icon={<FaUser />}  color="#ff4d4f" dark={dark} />
      </div>
      <Card title="User List" dark={dark}>
        <SimpleTable
          columns={columns}
          data={users}
          dark={dark}
          searchKeys={["name", "email", "phone", "gender", "status"]}
        />
      </Card>
    </Spin>
  );
}

// ── Revenue Tab ────────────────────────────────────────────────
function RevenueTab({ dark }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ date: null, month: null, year: null });
  const selectedBranchId = useCatalogStore((s) => s.selectedBranchId);

  const load = (f = filter) => {
    setLoading(true);
    const qs = buildQS({ ...f, branchId: selectedBranchId });
    request(`admin/dashboard${qs}`, "get")
      .then(res => { if (res?.success) setData(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedBranchId]);

  const handleFilter = (f) => { setFilter(f); load(f); };

  const axisColor = dark ? "#6b7280" : "#9ca3af";
  const gridColor = dark ? "#374151" : "#e5e7eb";
  const monthly   = data?.monthly_revenue ?? [];
  const stats     = data?.statistics ?? {};
  const chartYear = filter.year || dayjs().year();
  const currentRevenue = stats.total_revenue ?? 0;
  const {
    comparison,
    comparisonLoading,
    comparisonError,
    periodLabel,
    canCompare,
  } = useRevenuePeriodComparison(filter, selectedBranchId, currentRevenue);

  return (
    <Spin spinning={loading}>
      <DateFilter filter={filter} onChange={handleFilter} dark={dark} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <DashboardStatCard title="Total Users"      value={stats.total_users}    icon={<FaUsers />}         color="#fa8c16" dark={dark} loading={loading} />
        <DashboardStatCard title="Today Check-ins"  value={stats.today_checkins} icon={<FaCalendarAlt />}   color="#1677ff" dark={dark} loading={loading} />
        <DashboardStatCard title="Today Check-outs" value={stats.today_checkouts}icon={<FaCalendarAlt />}   color="#722ed1" dark={dark} loading={loading} />
        <RevenueStatCard
          revenue={currentRevenue}
          dark={dark}
          loading={loading}
          comparison={comparison}
          comparisonLoading={comparisonLoading}
          comparisonError={comparisonError}
          periodLabel={periodLabel}
          canCompare={canCompare}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
        <AdminMonthlyRevenueChart monthlyRevenue={monthly} loading={loading} year={chartYear} />
      </div>
      <AreaChartAnalaysisPerformance monthlyRevenue={monthly} loading={loading} year={chartYear} />
    </Spin>
  );
}

// ── Resort Tab ────────────────────────────────────────────────
function ResortTab({ dark }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("resort/dashboard", "get")
      .then(res => { if (res && !res.errors) setData(res); })
      .finally(() => setLoading(false));
  }, []);

  const d = data ?? {};

  return (
    <Spin spinning={loading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <DashboardStatCard title="Available Rooms" value={d.rooms_available   ?? 0} icon={<FaBed />}           color="#52c41a" dark={dark} loading={loading} />
        <DashboardStatCard title="Occupied Rooms"  value={d.rooms_occupied    ?? 0} icon={<FaHome />}          color="#1677ff" dark={dark} loading={loading} />
        <DashboardStatCard title="Maintenance"     value={d.rooms_maintenance ?? 0} icon={<FaClock />}         color="#faad14" dark={dark} loading={loading} />
        <DashboardStatCard title="Active Bookings" value={d.active_bookings   ?? 0} icon={<FaCalendarAlt />}   color="#722ed1" dark={dark} loading={loading} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <DashboardStatCard title="Check-in Today"  value={d.checkin_today     ?? 0} icon={<FaCheckCircle />}   color="#13c2c2" dark={dark} loading={loading} />
        <DashboardStatCard title="Check-out Today" value={d.checkout_today    ?? 0} icon={<FaTimesCircle />}   color="#ff4d4f" dark={dark} loading={loading} />
        <DashboardStatCard title="Today's Revenue" value={`$${Number(d.revenue_today ?? 0).toLocaleString()}`} icon={<FaMoneyBillWave />} color="#52c41a" dark={dark} loading={loading} />
        <DashboardStatCard title="Room Revenue"    value={`$${Number(d.revenue_total ?? 0).toLocaleString()}`} icon={<FaMoneyBillWave />} color="#1677ff" dark={dark} loading={loading} />
        <DashboardStatCard title="Outstanding"     value={`$${Number(d.outstanding_balance ?? 0).toLocaleString()}`} icon={<FaClock />} color="#faad14" dark={dark} loading={loading} />
        <DashboardStatCard title="Avg Rating"      value={d.average_rating ? Number(d.average_rating).toFixed(1) : "—"} icon={<FaChartBar />} color="#fa8c16" dark={dark} loading={loading} />
        <DashboardStatCard title="Coupons Used"    value={d.coupon_used       ?? 0} icon={<FaMoneyBillWave />} color="#52c41a" dark={dark} loading={loading} />
      </div>
      <div className="mb-4">
        <Chart_data_resort />
      </div>
    </Spin>
  );
}

// ── Restaurant Tab ─────────────────────────────────────────────
function RestaurantTab({ dark }) {
  const selectedBranchId = useCatalogStore((s) => s.selectedBranchId);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = buildQS({ branchId: selectedBranchId });
    request(`restaurant/dashboard${qs}`, "get")
      .then(res => { if (res) setData(res); })
      .finally(() => setLoading(false));
  }, [selectedBranchId]);

  const d = data ?? {};
  const topItems = d.top_menu_items ?? [];

  const card    = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const thText  = dark ? "text-gray-400 bg-gray-700/60" : "text-[#829AB1] bg-[#F5F8FC]";
  const tdText  = dark ? "text-gray-300" : "text-[#486581]";
  const trHover = dark ? "border-gray-700 hover:bg-gray-700/40" : "border-gray-100 hover:bg-[#F5F8FC]";
  const axisColor = dark ? "#6b7280" : "#9ca3af";
  const gridColor = dark ? "#374151" : "#e5e7eb";

  // build order status chart data from top_menu_items order counts
  const orderStatusData = [
    { status: "Today",   count: d.orders_today   ?? 0 },
    { status: "Pending", count: d.pending_orders ?? 0 },
    { status: "Tables",  count: (d.tables_available ?? 0) + (d.tables_occupied ?? 0) },
  ];

  return (
    <Spin spinning={loading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <DashboardStatCard title="Orders Today"       value={d.orders_today       ?? 0} icon={<FaConciergeBell />}   color="#fa8c16" dark={dark} loading={loading} />
        <DashboardStatCard title="Pending Orders"     value={d.pending_orders     ?? 0} icon={<FaClock />}           color="#faad14" dark={dark} loading={loading} />
        <DashboardStatCard title="Tables Available"   value={d.tables_available   ?? 0} icon={<MdTableRestaurant />} color="#52c41a" dark={dark} loading={loading} />
        <DashboardStatCard title="Tables Occupied"    value={d.tables_occupied    ?? 0} icon={<MdTableRestaurant />} color="#1677ff" dark={dark} loading={loading} />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DashboardStatCard title="Reservations Today" value={d.reservations_today ?? 0} icon={<FaCalendarAlt />}    color="#722ed1" dark={dark} loading={loading} />
        <DashboardStatCard title="Revenue Today"      value={`$${Number(d.revenue_today ?? 0).toLocaleString()}`}   icon={<FaMoneyBillWave />} color="#52c41a" dark={dark} loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Order Status Bar Chart */}
        <div
          className="w-full overflow-hidden rounded-xl border p-5 shadow-sm transition-colors duration-200"
          style={{ background: dark ? "#1f2937" : "#ffffff", borderColor: dark ? "#374151" : "#e5e7eb" }}
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: dark ? "#f9fafb" : "#111827" }}>Order Overview</h2>
              <p className="mt-1 text-sm" style={{ color: dark ? "#9ca3af" : "#6b7280" }}>Monthly restaurant orders trend</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
              <span className="text-sm" style={{ color: dark ? "#d1d5db" : "#374151" }}>Orders</span>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderOverviewData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={0.75} />
                    <stop offset="100%" stopColor="#fb923c" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={dark ? "#374151" : "#e5e7eb"} strokeDasharray="3 3" opacity={0.8} />
                <XAxis dataKey="month" axisLine={{ stroke: dark ? "#9ca3af" : "#d1d5db" }} tickLine={false} tick={{ fill: dark ? "#d1d5db" : "#6b7280", fontSize: 12 }} />
                <YAxis axisLine={{ stroke: dark ? "#9ca3af" : "#d1d5db" }} tickLine={false} tick={{ fill: dark ? "#d1d5db" : "#6b7280", fontSize: 12 }} width={40} />
                <Tooltip
                  cursor={{ stroke: dark ? "#6b7280" : "#d1d5db", strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: dark ? "#18181b" : "#ffffff",
                    border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "8px",
                    color: dark ? "#ffffff" : "#111827",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  }}
                  labelStyle={{ color: dark ? "#ffffff" : "#111827", fontWeight: 600, marginBottom: "6px" }}
                  itemStyle={{ color: dark ? "#d1d5db" : "#374151" }}
                />
                <Area type="monotone" dataKey="orders" name="Orders" stroke="#fb923c" strokeWidth={2} fill="url(#ordersGradient)" fillOpacity={1} activeDot={{ r: 5, fill: dark ? "#18181b" : "#ffffff", stroke: "#fb923c", strokeWidth: 3 }} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
{/* Restaurant Sales Pie Chart */}
        <ChartCircleRestaurant />
      </div>

      {/* Top Menu Items table */}
      {topItems.length > 0 && (
        <div className={`rounded-xl border overflow-hidden ${card}`}>
          <div className={`px-5 py-3 border-b text-sm font-semibold ${dark ? "border-gray-700 text-gray-200" : "border-[#D9E2EC] text-[#102A43]"}`}>
            Top Menu Items
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {["#", "Item", "Category", "Price", "Orders"].map(h => (
                    <th key={h} className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={item.id} className={`border-b transition-colors ${trHover}`}>
                    <td className={`px-4 py-3 text-sm ${tdText}`}>{i + 1}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${tdText}`}>{item.name}</td>
                    <td className={`px-4 py-3 text-sm ${tdText}`}>{item.category?.name ?? "—"}</td>
                    <td className={`px-4 py-3 text-sm ${tdText}`}>${Number(item.price ?? 0).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${dark ? "text-orange-400" : "text-orange-600"}`}>{item.order_items_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Spin>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function DashboardOverview() {
  const dark = useDarkMode();
  const tabLabelCls = dark ? "text-gray-300" : "text-[#486581]";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <Tabs
        defaultActiveKey="overview"
        tabBarStyle={{
          marginBottom: 0,
          background: dark ? "#1f2937" : "#ffffff",
          borderRadius: "0.75rem 0.75rem 0 0",
          padding: "0 16px",
          borderBottom: dark ? "1px solid #374151" : "1px solid #D9E2EC",
        }}
        items={[
          {
            key: "overview",
            label: <span className={`flex items-center gap-1 ${tabLabelCls}`}><BiSolidDashboard /> Overview</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}><OverviewTab dark={dark} /></div>,
          },
          {
            key: "revenue",
            label: <span className={`flex items-center gap-1 ${tabLabelCls}`}><FaChartLine /> Revenue Analytics</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}><RevenueTab dark={dark} /></div>,
          },
           {
            key: "resort",
            label: <span className={`flex items-center gap-1 ${tabLabelCls}`}><FaHome /> Resort</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}><ResortTab dark={dark} /></div>,
          },
          {
            key: "restaurant",
            label: <span className={`flex items-center gap-1 ${tabLabelCls}`}><BsShopWindow /> Restaurant</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}><RestaurantTab dark={dark} /></div>,
          },
          {
            key: "reservation",
            label: <span className={`flex items-center gap-1 ${tabLabelCls}`}><FaCalendarAlt /> Reservation</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}><ReservationTab dark={dark} /></div>,
          },
         
          // {
          //   key: "guest",
          //   label: <span className={`flex items-center gap-1 ${tabLabelCls}`}><FaUsers /> Users</span>,
          //   children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}><GuestTab dark={dark} /></div>,
          // },
          {
            key: "payment",
            label: <span className={`flex items-center gap-1 ${tabLabelCls}`}><FaDollarSign /> Payment</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}><PaymentTab dark={dark} /></div>,
          },
        ]}
      />
    </div>

   
  );
}
