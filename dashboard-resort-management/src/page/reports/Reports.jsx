import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button, DatePicker, Select, Segmented, message, Empty, Input, Skeleton,
} from "antd";
import dayjs from "dayjs";
import {
  FaCalendarAlt, FaDollarSign, FaUsers, FaBed, FaDownload, FaPrint, FaSync,
} from "react-icons/fa";
import { MdBarChart, MdSearch } from "react-icons/md";
import { fmtAmt } from "../Payment/paymentHelpers";
import { fmtDateTime } from "../../util/fmtDateTime";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useDarkMode } from "../../util/DarkModeContext";
import { request } from "../../util/request";
import { ProfileStore } from "../../store/ProfileStore";
import useCatalogData from "../../hooks/useCatalogData";
import { asList } from "../Room/roomHelpers";
import PrintPortal from "../Payment/PrintPortal";
import ReportsPrint from "./ReportsPrint";
import {
  DATE_PRESETS, REPORT_TYPES, presetToRange, buildReportQuery,
  fmtMoney, fmtPct, downloadReportCsv, statusPieData, roomStatusPie,
} from "./reportHelpers";

const { RangePicker } = DatePicker;
const CHART_HEIGHT = 280;
const DAILY_PAGE_SIZE = 15;
const BOOKING_DETAILS_PAGE_SIZE = 15;

function StatCard({ title, value, subtitle, icon, color, dark, loading, financial }) {
  return (
    <div
      className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${dark ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-[#D9E2EC] shadow-sm hover:border-[#BCCCDC]"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-xs font-semibold uppercase tracking-wide leading-snug ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
          {title}
        </span>
        <span className="text-lg shrink-0 opacity-90" style={{ color }} aria-hidden>{icon}</span>
      </div>
      {loading
        ? <div className={`h-9 w-28 rounded animate-pulse ${dark ? "bg-gray-700" : "bg-[#F5F8FC]"}`} />
        : (
          <div
            className={`font-bold tabular-nums tracking-tight ${financial ? "text-2xl sm:text-3xl" : "text-2xl"}`}
            style={{ color }}
          >
            {value}
          </div>
        )
      }
      {subtitle && (
        <p className={`text-xs mt-2 ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>{subtitle}</p>
      )}
    </div>
  );
}

const BOOKING_STATUS_STYLE = {
  pending:     { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  confirmed:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  checked_in:  { dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",       dark: "bg-blue-900/40 text-blue-400 ring-blue-700"     },
  checked_out: { dot: "bg-purple-500", light: "bg-purple-50 text-purple-700 ring-purple-200", dark: "bg-purple-900/40 text-purple-400 ring-purple-700" },
  cancelled:   { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",           dark: "bg-red-900/40 text-red-400 ring-red-700"         },
  completed:   { dot: "bg-teal-500",   light: "bg-teal-50 text-teal-700 ring-teal-200",       dark: "bg-teal-900/40 text-teal-400 ring-teal-700"     },
};

function BookingStatusBadge({ status, dark }) {
  const s = BOOKING_STATUS_STYLE[status] ?? BOOKING_STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—"}
    </span>
  );
}

function roomNumbersForBooking(booking) {
  const rooms = booking?.rooms;
  if (!Array.isArray(rooms) || !rooms.length) return "—";
  return rooms.map((r) => r.room_number).filter(Boolean).join(", ") || "—";
}

function Panel({ title, subtitle, children, dark, className = "", loading }) {
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subCls = dark ? "text-gray-500" : "text-[#829AB1]";
  return (
    <div className={`rounded-xl border overflow-hidden ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"} ${className}`}>
      {title && (
        <div className={`px-5 py-4 border-b ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <h3 className={`text-sm font-semibold ${titleCls}`}>{title}</h3>
          {subtitle && <p className={`text-xs mt-0.5 ${subCls}`}>{subtitle}</p>}
        </div>
      )}
      <div className="p-5">
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} className={dark ? "[&_.ant-skeleton-content]:bg-gray-700" : ""} />
        ) : children}
      </div>
    </div>
  );
}

function ChartEmpty({ description, dark }) {
  return (
    <div className="py-8">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<span className={dark ? "text-gray-400" : "text-[#829AB1]"}>{description}</span>}
      />
    </div>
  );
}

export default function Reports() {
  const dark = useDarkMode();
  const { access_token: token } = ProfileStore();

  const initial = presetToRange("this_month");
  const [preset, setPreset] = useState("this_month");
  const [dateRange, setDateRange] = useState([initial.from, initial.to]);
  const [resortId, setResortId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [reportType, setReportType] = useState("bookings");
  const { resorts, branches: allBranches } = useCatalogData({ autoFetch: false });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyPage, setDailyPage] = useState(1);
  const [printOpen, setPrintOpen] = useState(false);
  const [periodBookings, setPeriodBookings] = useState([]);
  const [dailySearch, setDailySearch] = useState("");
  const [bookingDetailsPage, setBookingDetailsPage] = useState(1);

  const filters = useMemo(() => ({
    dateFrom: dateRange[0]?.format("YYYY-MM-DD"),
    dateTo: dateRange[1]?.format("YYYY-MM-DD"),
    resortId,
    branchId,
    page: dailyPage,
    perPage: DAILY_PAGE_SIZE,
  }), [dateRange, resortId, branchId, dailyPage]);

  const load = useCallback((page = dailyPage) => {
    setLoading(true);
    setError(null);
    const qs = buildReportQuery({ ...filters, page, perPage: DAILY_PAGE_SIZE });
    Promise.all([
      request(`admin/reports${qs}`, "get"),
      request("admin/bookings", "get"),
    ]).then(([res, bookingsRes]) => {
      if (res?.success) {
        setData(res.data);
      } else {
        setData(null);
        setError(res?.errors?.message ?? "Failed to load reports");
      }
      if (bookingsRes?.data) {
        setPeriodBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      }
    }).finally(() => setLoading(false));
  }, [filters, dailyPage]);

  const goToDailyPage = useCallback((page) => {
    const p = Math.max(1, page);
    setDailyPage(p);
    load(p);
  }, [load]);

  const branches = useMemo(() => {
    if (!resortId) return [];
    return allBranches.filter((b) => String(b.resort_id) === String(resortId));
  }, [allBranches, resortId]);

  useEffect(() => {
    if (!resortId) setBranchId(null);
  }, [resortId]);

  useEffect(() => { load(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => {
    setDailyPage(1);
    setBookingDetailsPage(1);
    load(1);
  };

  const resetFilters = () => {
    const r = presetToRange("this_month");
    setPreset("this_month");
    setDateRange([r.from, r.to]);
    setResortId(null);
    setBranchId(null);
    setReportType("bookings");
    setDailyPage(1);
    setBookingDetailsPage(1);
    setTimeout(() => load(1), 0);
  };

  const onPresetChange = (key) => {
    setPreset(key);
    if (key !== "custom") {
      const r = presetToRange(key);
      setDateRange([r.from, r.to]);
    }
  };

  const handleExport = () => {
    downloadReportCsv(filters, token).catch(() => message.error("CSV export failed"));
  };

  const handlePrint = () => {
    setPrintOpen(true);
    setTimeout(() => {
      window.print();
      setPrintOpen(false);
    }, 400);
  };

  const axisColor = dark ? "#9ca3af" : "#829AB1";
  const gridColor = dark ? "#374151" : "#e5e7eb";
  const tooltipStyle = dark
    ? { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f3f4f6" }
    : { backgroundColor: "#fff", border: "1px solid #D9E2EC", borderRadius: 8, color: "#102A43" };
  const contentLoading = loading && !data;
  const summary = data?.summary;
  const bookings = data?.bookings;
  const revenue = data?.revenue;
  const rooms = data?.rooms;
  const guests = data?.guests;
  const daily = data?.daily;
  const hasData = data && (bookings?.total > 0 || revenue?.paid_amount > 0 || (rooms?.total ?? 0) > 0);

  const bookingTrend = bookings?.by_date ?? [];
  const revenueTrend = revenue?.by_date ?? [];
  const occupancyTrend = rooms?.occupancy_by_date ?? [];

  const dailyRows = daily?.rows ?? [];
  const dailyRecordTotal = daily?.pagination?.total ?? dailyRows.length;
  const dailyPerPage = daily?.pagination?.per_page ?? DAILY_PAGE_SIZE;
  const dailyPageCurrent = daily?.pagination?.page ?? dailyPage;
  const dailyTotalPages = daily?.pagination?.total_pages
    ?? Math.max(1, Math.ceil(dailyRecordTotal / dailyPerPage));
  const dailyShowingFrom = dailyRecordTotal === 0 ? 0 : (dailyPageCurrent - 1) * dailyPerPage + 1;
  const dailyShowingTo = Math.min(dailyPageCurrent * dailyPerPage, dailyRecordTotal);

  const bookingsInPeriod = useMemo(() => {
    const from = filters.dateFrom;
    const to = filters.dateTo;
    if (!from || !to) return [];
    const q = dailySearch.toLowerCase();
    return periodBookings.filter((b) => {
      const created = b.created_at?.slice(0, 10);
      if (!created || created < from || created > to) return false;
      if (resortId && String(b.resort_id) !== String(resortId)) return false;
      if (branchId) {
        const rooms = b.rooms ?? [];
        if (!rooms.some((r) => String(r.branch_id) === String(branchId))) return false;
      }
      if (!q) return true;
      const guest = b.user?.name?.toLowerCase() ?? "";
      const rooms = roomNumbersForBooking(b).toLowerCase();
      const code = (b.booking_code ?? "").toLowerCase();
      return guest.includes(q) || rooms.includes(q) || code.includes(q);
    });
  }, [periodBookings, filters.dateFrom, filters.dateTo, resortId, branchId, dailySearch]);

  useEffect(() => {
    setBookingDetailsPage(1);
  }, [filters.dateFrom, filters.dateTo, resortId, branchId, dailySearch]);

  const bookingDetailsTotal = bookingsInPeriod.length;
  const bookingDetailsTotalPages = Math.max(
    1,
    Math.ceil(bookingDetailsTotal / BOOKING_DETAILS_PAGE_SIZE),
  );
  const bookingDetailsPageCurrent = Math.min(bookingDetailsPage, bookingDetailsTotalPages);

  const paginatedBookingsInPeriod = useMemo(() => {
    const start = (bookingDetailsPageCurrent - 1) * BOOKING_DETAILS_PAGE_SIZE;
    return bookingsInPeriod.slice(start, start + BOOKING_DETAILS_PAGE_SIZE);
  }, [bookingsInPeriod, bookingDetailsPageCurrent]);

  const bookingDetailsShowingFrom = bookingDetailsTotal === 0
    ? 0
    : (bookingDetailsPageCurrent - 1) * BOOKING_DETAILS_PAGE_SIZE + 1;
  const bookingDetailsShowingTo = Math.min(
    bookingDetailsPageCurrent * BOOKING_DETAILS_PAGE_SIZE,
    bookingDetailsTotal,
  );

  const goToBookingDetailsPage = useCallback((page) => {
    setBookingDetailsPage(Math.max(1, Math.min(page, bookingDetailsTotalPages)));
  }, [bookingDetailsTotalPages]);

  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subCls = dark ? "text-gray-400" : "text-[#829AB1]";
  const inputCls = dark ? "[&_.ant-picker]:bg-gray-700 [&_.ant-picker]:border-gray-600" : "";
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const cardHdr = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const thead = dark ? "bg-gray-700/60" : "bg-[#F5F8FC]";
  const thText = dark ? "text-gray-400" : "text-[#829AB1]";
  const tbody = dark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-100";
  const rowHover = dark ? "hover:bg-gray-700/50" : "hover:bg-[#F5F8FC]";
  const cellText = dark ? "text-gray-300" : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]" : "text-[#829AB1]";
  const divider = dark ? "divide-gray-700" : "divide-gray-200";
  const pageBtn = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  const renderTypeSection = () => {
    if (!data && !contentLoading) return null;

    if (reportType === "bookings") {
      const pie = statusPieData(bookings?.by_status);
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel
            title="Bookings by date"
            subtitle="Daily booking activity during the selected period."
            dark={dark}
            loading={contentLoading}
          >
            {bookingTrend.length === 0 ? (
              <ChartEmpty dark={dark} description="No bookings were found for the selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart data={bookingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" name="Bookings" stroke="#1677ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Panel>
          <Panel
            title="Status distribution"
            subtitle="Breakdown of bookings by current status."
            dark={dark}
            loading={contentLoading}
          >
            {pie.length === 0 ? (
              <ChartEmpty dark={dark} description="No booking status data for the selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {pie.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
          <Panel
            title="Bookings by resort"
            subtitle="Volume of bookings grouped by resort."
            dark={dark}
            className="lg:col-span-2"
            loading={contentLoading}
          >
            {(bookings?.by_resort ?? []).length === 0 ? (
              <ChartEmpty dark={dark} description="No resort booking data for the selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={bookings.by_resort}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="resort_name" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Bookings" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      );
    }

    if (reportType === "revenue") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel
            title="Paid revenue by date"
            subtitle="Collected payments per day in the selected period."
            dark={dark}
            loading={contentLoading}
          >
            {revenueTrend.length === 0 ? (
              <ChartEmpty dark={dark} description="No revenue data is available for the selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <AreaChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#52c41a" fill="#52c41a33" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Panel>
          <Panel
            title="Revenue by payment method"
            subtitle="Distribution of collected payments by method."
            dark={dark}
            loading={contentLoading}
          >
            {(revenue?.by_payment_method ?? []).length === 0 ? (
              <ChartEmpty dark={dark} description="No payment method breakdown for the selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={revenue.by_payment_method} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis type="category" dataKey="method" tick={{ fill: axisColor, fontSize: 11 }} width={72} />
                  <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" name="Revenue" fill="#1677ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
          <Panel
            title="Revenue summary"
            subtitle="Totals from the report API for the selected filters."
            dark={dark}
            className="lg:col-span-2"
            loading={contentLoading}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                ["Gross (booking total)", fmtMoney(revenue?.gross_revenue)],
                ["Paid", fmtMoney(revenue?.paid_amount)],
                ["Pending", fmtMoney(revenue?.pending_amount)],
                ["Outstanding", fmtMoney(revenue?.outstanding)],
                ["Refunded", fmtMoney(revenue?.refunded_amount)],
                ["Discount", fmtMoney(revenue?.discount_amount)],
                ["Tax", fmtMoney(revenue?.tax_amount)],
                ["Service charge", fmtMoney(revenue?.service_charge)],
              ].map(([label, val]) => (
                <div key={label} className={`rounded-lg border p-3 ${dark ? "border-gray-700 bg-gray-900/30" : "border-[#D9E2EC] bg-[#F5F8FC]/50"}`}>
                  <p className={`text-xs uppercase tracking-wide ${subCls}`}>{label}</p>
                  <p className={`font-semibold mt-1 tabular-nums ${titleCls}`}>{val}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      );
    }

    if (reportType === "rooms") {
      const pie = roomStatusPie(rooms?.by_status);
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel
            title="Room status"
            subtitle="Current room inventory by status."
            dark={dark}
            loading={contentLoading}
          >
            {pie.length === 0 ? (
              <ChartEmpty dark={dark} description="No room status data is available." />
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                    {pie.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
          <Panel
            title="Occupancy by date"
            subtitle="Daily occupancy rate (stays vs sellable rooms)."
            dark={dark}
            loading={contentLoading}
          >
            {occupancyTrend.length === 0 ? (
              <ChartEmpty dark={dark} description="No room activity is available for the selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart data={occupancyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "Rate"]} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="rate" name="Occupancy" stroke="#FF6B00" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel
          title="Guests by date"
          subtitle="Guest headcount per day in the selected period."
          dark={dark}
          loading={contentLoading}
        >
          {(guests?.by_date ?? []).length === 0 ? (
            <ChartEmpty dark={dark} description="No guest activity for the selected period." />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={guests.by_date}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="guests" name="Guests" stroke="#722ed1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>
        <Panel
          title="Guest metrics"
          subtitle="Summary counts from the report API."
          dark={dark}
          loading={contentLoading}
        >
          <ul className={`space-y-3 text-sm ${titleCls}`}>
            {[
              ["Registered guests (all time)", guests?.total_registered ?? 0],
              ["Unique guests (period bookings)", guests?.unique_guests ?? 0],
              ["Headcount (adults + children)", guests?.guest_headcount ?? 0],
              ["New guest profiles", guests?.new_guests ?? 0],
              ["Returning guests", guests?.returning_guests ?? 0],
            ].map(([label, val]) => (
              <li key={label} className={`flex justify-between gap-4 py-1 border-b last:border-0 ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
                <span className={subCls}>{label}</span>
                <strong className="tabular-nums">{val}</strong>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  };

  const searchInputStyle = dark
    ? { background: "#374151", borderColor: "#4b5563", color: "#f3f4f6" }
    : undefined;

  const dailyColumns = [
    { key: "date", label: "Date", align: "left" },
    { key: "bookings", label: "Bookings", align: "right" },
    { key: "guests", label: "Guests", align: "right" },
    { key: "revenue", label: "Revenue", align: "right" },
    { key: "paid", label: "Paid", align: "right" },
    { key: "pending", label: "Pending", align: "right" },
    { key: "active_stays", label: "Active stays", align: "right" },
  ];

  return (
    <div
      className={`min-h-full rounded-xl p-4 sm:p-6 transition-colors duration-200 reports-page max-w-[1600px] mx-auto ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
    >
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 no-print">
        <div className="min-w-0">
          <h1 className={`text-2xl sm:text-[26px] font-bold flex items-center gap-2 ${titleCls}`}>
            <MdBarChart className="text-[#FF6B00] shrink-0" aria-hidden /> Reports
          </h1>
          <p className={`text-sm mt-1 max-w-xl ${subCls}`}>
            Analytics and operational performance overview for your selected period and filters.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="primary"
            icon={<FaDownload />}
            onClick={handleExport}
            disabled={loading || !data}
            aria-label="Export report as CSV"
          >
            Export CSV
          </Button>
          <Button
            icon={<FaPrint />}
            onClick={handlePrint}
            disabled={loading || !data}
            aria-label="Print report"
          >
            Print
          </Button>
          <Button
            icon={<FaSync />}
            onClick={() => load(dailyPage)}
            loading={loading}
            aria-label="Refresh report data"
          >
            Refresh
          </Button>
        </div>
      </header>

      <section
        className={`rounded-xl border p-4 sm:p-5 mb-6 no-print ${dark ? "bg-gray-800/80 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"} ${inputCls}`}
        aria-label="Report filters"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-4 items-end">
          <div className="xl:col-span-4 min-w-0">
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${subCls}`}>Period</label>
            <div className="overflow-x-auto pb-0.5">
              <Segmented
                options={DATE_PRESETS.map((p) => ({ label: p.label, value: p.key }))}
                value={preset}
                onChange={onPresetChange}
                size="middle"
                className="max-w-full"
              />
            </div>
          </div>
          <div className="xl:col-span-3 min-w-0">
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${subCls}`}>Date range</label>
            <RangePicker
              value={dateRange}
              onChange={(vals) => {
                setPreset("custom");
                setDateRange(vals || []);
              }}
              allowClear={false}
              className="w-full"
            />
          </div>
          <div className="xl:col-span-2 min-w-0">
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${subCls}`}>Resort</label>
            <Select
              allowClear
              placeholder="All resorts"
              value={resortId}
              onChange={(v) => { setResortId(v ?? null); setBranchId(null); }}
              className="w-full"
              options={resorts.map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>
          <div className="xl:col-span-2 min-w-0">
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${subCls}`}>Branch</label>
            <Select
              allowClear
              disabled={!resortId}
              placeholder="All branches"
              value={branchId}
              onChange={(v) => setBranchId(v ?? null)}
              className="w-full"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
          <div className="xl:col-span-1 flex flex-wrap gap-2 sm:justify-end">
            <Button type="primary" onClick={applyFilters} loading={loading} className="min-w-[88px]">
              Apply
            </Button>
            <Button onClick={resetFilters} disabled={loading}>
              Reset
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className={`mb-5 rounded-lg border px-4 py-3 text-sm no-print ${dark ? "border-red-500/50 bg-red-900/20 text-red-300" : "border-red-400 bg-red-50 text-red-700"}`}
        >
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6" aria-label="Key metrics">
        <StatCard
          title="Total bookings"
          subtitle="Booking activity in period"
          value={summary?.total_bookings ?? "—"}
          icon={<FaCalendarAlt />}
          color="#1677ff"
          dark={dark}
          loading={contentLoading}
        />
        <StatCard
          title="Revenue (paid)"
          subtitle="Collected payments"
          value={fmtMoney(summary?.revenue)}
          icon={<FaDollarSign />}
          color="#52c41a"
          dark={dark}
          loading={contentLoading}
          financial
        />
        <StatCard
          title="Occupancy rate"
          subtitle="Average occupancy"
          value={fmtPct(summary?.occupancy_rate)}
          icon={<FaBed />}
          color="#FF6B00"
          dark={dark}
          loading={contentLoading}
        />
        <StatCard
          title="Total guests"
          subtitle="Guest headcount"
          value={summary?.total_guests ?? "—"}
          icon={<FaUsers />}
          color="#722ed1"
          dark={dark}
          loading={contentLoading}
        />
      </section>

      <section className="mb-5 no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" aria-label="Report view">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${subCls}`}>View</p>
          <p className={`text-sm mt-0.5 ${dark ? "text-gray-300" : "text-[#486581]"}`}>
            Choose which analytics charts to display below.
          </p>
        </div>
        <Segmented
          options={REPORT_TYPES.map((t) => ({ label: t.label, value: t.value }))}
          value={reportType}
          onChange={setReportType}
          size="large"
          className="self-start sm:self-auto"
        />
      </section>

      {!loading && !hasData && (
        <Panel dark={dark} className="mb-6 no-print" title="No data">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className={subCls}>
                No report data was found for the selected period. Try a different date range or filters, then click Apply.
              </span>
            }
          />
        </Panel>
      )}

      <section className="mb-6 no-print space-y-5" aria-label="Report charts">
        {renderTypeSection()}
      </section>

      <section
        className={`rounded-xl border overflow-hidden mb-6 no-print ${card}`}
        aria-labelledby="daily-breakdown-heading"
      >
        <div className={`px-5 sm:px-6 py-4 border-b ${cardHdr}`}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="daily-breakdown-heading" className={`text-lg font-semibold ${titleCls}`}>Daily breakdown</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 tabular-nums ${dark ? "bg-gray-700/80 text-gray-300 ring-gray-600" : "bg-[#F5F8FC] text-[#486581] ring-[#D9E2EC]"}`}>
              {dailyRecordTotal} {dailyRecordTotal === 1 ? "record" : "records"}
            </span>
          </div>
          <p className={`text-xs mt-1 ${subCls}`}>Aggregated totals per day for the selected period.</p>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {dailyColumns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider ${thText} ${col.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y ${divider}`}>
              {contentLoading ? (
                <tr>
                  <td colSpan={7} className="py-6 px-5">
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </td>
                </tr>
              ) : dailyRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`py-12 text-center text-sm ${subCls}`}>
                    No daily breakdown data for the selected period.
                  </td>
                </tr>
              ) : dailyRows.map((row) => (
                <tr key={row.date} className={rowHover}>
                  <td className={`px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap ${titleCls}`}>{row.date}</td>
                  <td className={`px-4 sm:px-5 py-3 text-sm text-right tabular-nums ${cellText}`}>{row.bookings}</td>
                  <td className={`px-4 sm:px-5 py-3 text-sm text-right tabular-nums ${cellText}`}>{row.guests}</td>
                  <td className={`px-4 sm:px-5 py-3 text-sm text-right font-medium tabular-nums ${titleCls}`}>{fmtMoney(row.revenue)}</td>
                  <td className={`px-4 sm:px-5 py-3 text-sm text-right tabular-nums ${cellText}`}>{fmtMoney(row.paid)}</td>
                  <td className={`px-4 sm:px-5 py-3 text-sm text-right tabular-nums ${dark ? "text-amber-400" : "text-amber-600"}`}>{fmtMoney(row.pending)}</td>
                  <td className={`px-4 sm:px-5 py-3 text-sm text-right tabular-nums ${cellText}`}>{row.active_stays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!contentLoading && dailyRecordTotal > 0 && (
          <div className={`px-5 sm:px-6 py-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm ${cardHdr} ${subCls}`}>
            <span className="tabular-nums">
              Showing {dailyShowingFrom}–{dailyShowingTo} of {dailyRecordTotal} days
              {dailyTotalPages > 1 && (
                <span className="hidden sm:inline"> · Page {dailyPageCurrent} of {dailyTotalPages}</span>
              )}
            </span>
            {dailyTotalPages > 1 && (
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  onClick={() => goToDailyPage(Math.max(1, dailyPageCurrent - 1))}
                  disabled={dailyPageCurrent <= 1 || loading}
                  className={pageBtn}
                  aria-label="Previous daily breakdown page"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(dailyTotalPages, 7) }, (_, i) => {
                  const start = dailyTotalPages <= 7
                    ? 1
                    : Math.max(1, Math.min(dailyPageCurrent - 3, dailyTotalPages - 6));
                  const pg = start + i;
                  return (
                    <Button
                      key={pg}
                      onClick={() => goToDailyPage(pg)}
                      disabled={loading}
                      className={`min-w-8 h-8 rounded-lg text-xs font-medium transition-colors px-2 ${
                        dailyPageCurrent === pg
                          ? "bg-[#FF6B00] text-white border-[#FF6B00]"
                          : dark ? "hover:bg-gray-700 text-gray-400 border-gray-600" : "hover:bg-[#F5F8FC] text-[#486581] border-[#D9E2EC]"
                      }`}
                      aria-label={`Daily breakdown page ${pg}`}
                      aria-current={dailyPageCurrent === pg ? "page" : undefined}
                    >
                      {pg}
                    </Button>
                  );
                })}
                <Button
                  onClick={() => goToDailyPage(Math.min(dailyTotalPages, dailyPageCurrent + 1))}
                  disabled={dailyPageCurrent >= dailyTotalPages || loading}
                  className={pageBtn}
                  aria-label="Next daily breakdown page"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <section
        className={`rounded-xl border overflow-hidden no-print ${card}`}
        aria-labelledby="booking-details-heading"
      >
        <div className={`px-5 sm:px-6 py-4 border-b flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${cardHdr}`}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="booking-details-heading" className={`text-lg font-semibold ${titleCls}`}>Booking details</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 tabular-nums ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-blue-50 text-blue-700 ring-blue-200"}`}>
                {bookingsInPeriod.length} {bookingsInPeriod.length === 1 ? "booking" : "bookings"}
              </span>
            </div>
            <p className={`text-xs mt-1 ${subCls}`}>Bookings created within the filter period (client-side list).</p>
          </div>
          <Input
            allowClear
            prefix={<MdSearch className="text-gray-400 text-base" aria-hidden />}
            placeholder="Search guest, room, booking…"
            value={dailySearch}
            onChange={(e) => setDailySearch(e.target.value)}
            className="w-full lg:max-w-xs"
            style={searchInputStyle}
            aria-label="Search bookings"
          />
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Guest", "Room", "Booking", "Check-in", "Check-out", "Total", "Balance", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-4 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider ${thText} ${h === "No." ? "w-12" : ""} ${["Total", "Balance"].includes(h) ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y ${divider}`}>
              {bookingsInPeriod.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`py-14 text-center text-sm ${subCls}`}>
                    {dailySearch.trim()
                      ? "No bookings match your search in this period."
                      : "No bookings were found for the selected period."}
                  </td>
                </tr>
              ) : paginatedBookingsInPeriod.map((b, idx) => (
                <tr key={b.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 sm:px-5 py-3.5 text-sm font-medium tabular-nums ${cellMuted}`}>{bookingDetailsShowingFrom + idx}</td>
                  <td className={`px-4 sm:px-5 py-3.5 text-sm font-medium ${titleCls}`}>{b.user?.name ?? "—"}</td>
                  <td className={`px-4 sm:px-5 py-3.5 text-sm ${cellText}`}>{roomNumbersForBooking(b)}</td>
                  <td className={`px-4 sm:px-5 py-3.5 text-sm font-mono text-xs sm:text-sm ${cellText}`}>{b.booking_code ?? `BK-${b.id}`}</td>
                  <td className={`px-4 sm:px-5 py-3.5 text-sm whitespace-nowrap ${cellText}`}>{fmtDateTime(b.check_in)}</td>
                  <td className={`px-4 sm:px-5 py-3.5 text-sm whitespace-nowrap ${cellText}`}>{fmtDateTime(b.check_out)}</td>
                  <td className={`px-4 sm:px-5 py-3.5 text-sm text-right font-medium tabular-nums ${titleCls}`}>{fmtAmt(b.total_amount)}</td>
                  <td className={`px-4 sm:px-5 py-3.5 text-sm text-right font-medium tabular-nums ${Number(b.balance_due ?? 0) > 0.009 ? (dark ? "text-amber-400" : "text-amber-600") : (dark ? "text-green-400" : "text-green-600")}`}>
                    {fmtAmt(b.balance_due)}
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                    <BookingStatusBadge status={b.status} dark={dark} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookingDetailsTotal > 0 && (
          <div className={`px-5 sm:px-6 py-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm ${cardHdr} ${subCls}`}>
            <span className="tabular-nums">
              Showing {bookingDetailsShowingFrom}–{bookingDetailsShowingTo} of {bookingDetailsTotal} bookings
              {bookingDetailsTotalPages > 1 && (
                <span className="hidden sm:inline"> · Page {bookingDetailsPageCurrent} of {bookingDetailsTotalPages}</span>
              )}
            </span>
            {bookingDetailsTotalPages > 1 && (
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  onClick={() => goToBookingDetailsPage(bookingDetailsPageCurrent - 1)}
                  disabled={bookingDetailsPageCurrent <= 1}
                  className={pageBtn}
                  aria-label="Previous booking details page"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(bookingDetailsTotalPages, 7) }, (_, i) => {
                  const start = bookingDetailsTotalPages <= 7
                    ? 1
                    : Math.max(1, Math.min(bookingDetailsPageCurrent - 3, bookingDetailsTotalPages - 6));
                  const pg = start + i;
                  return (
                    <Button
                      key={pg}
                      onClick={() => goToBookingDetailsPage(pg)}
                      className={`min-w-8 h-8 rounded-lg text-xs font-medium transition-colors px-2 ${
                        bookingDetailsPageCurrent === pg
                          ? "bg-[#FF6B00] text-white border-[#FF6B00]"
                          : dark ? "hover:bg-gray-700 text-gray-400 border-gray-600" : "hover:bg-[#F5F8FC] text-[#486581] border-[#D9E2EC]"
                      }`}
                      aria-label={`Booking details page ${pg}`}
                      aria-current={bookingDetailsPageCurrent === pg ? "page" : undefined}
                    >
                      {pg}
                    </Button>
                  );
                })}
                <Button
                  onClick={() => goToBookingDetailsPage(bookingDetailsPageCurrent + 1)}
                  disabled={bookingDetailsPageCurrent >= bookingDetailsTotalPages}
                  className={pageBtn}
                  aria-label="Next booking details page"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <PrintPortal active={printOpen}>
        <ReportsPrint data={data} filters={filters} resorts={resorts} branches={branches} />
      </PrintPortal>
    </div>
  );
}
