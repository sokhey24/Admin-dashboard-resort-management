import { useEffect, useState } from "react";
import { Tabs, Spin, Modal, Form, Select, message } from "antd";
import { Row, Col } from "antd";
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  UserOutlined, TeamOutlined, DollarOutlined, DownloadOutlined, BarChartOutlined,
} from "@ant-design/icons";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useDarkMode } from "../../util/DarkModeContext";
import { request } from "../../util/request";
import ActionButtons from "../../components/ActionButtons";
import ChartDataDashboard from "../Chart_Data/ChartDataDashboard";

const { Option } = Select;

// ── Raw revenue data ───────────────────────────────────────────
const RAW = {
  "2025-07-14": { room: 1800, restaurant: 500,  other: 120 },
  "2025-07-15": { room: 2100, restaurant: 620,  other: 150 },
  "2025-07-16": { room: 1600, restaurant: 410,  other: 90  },
  "2025-07-17": { room: 2400, restaurant: 700,  other: 180 },
  "2025-07-18": { room: 3100, restaurant: 900,  other: 220 },
  "2025-07-19": { room: 3800, restaurant: 1100, other: 280 },
  "2025-07-20": { room: 2900, restaurant: 850,  other: 200 },
  "2025-06-14": { room: 1500, restaurant: 400,  other: 100 },
  "2025-06-15": { room: 1700, restaurant: 450,  other: 110 },
  "2025-05-10": { room: 2200, restaurant: 600,  other: 160 },
  "2025-04-08": { room: 1400, restaurant: 380,  other: 90  },
  "2025-03-12": { room: 1800, restaurant: 520,  other: 120 },
  "2025-02-20": { room: 1500, restaurant: 410,  other: 100 },
  "2025-01-05": { room: 1200, restaurant: 320,  other: 80  },
  "2024-12-25": { room: 3200, restaurant: 950,  other: 300 },
  "2024-11-11": { room: 2100, restaurant: 600,  other: 170 },
  "2024-10-05": { room: 1900, restaurant: 540,  other: 140 },
  "2024-07-04": { room: 2800, restaurant: 800,  other: 220 },
  "2023-12-31": { room: 3500, restaurant: 1000, other: 320 },
  "2022-06-15": { room: 1600, restaurant: 450,  other: 110 },
};

function buildRows(entries) {
  return entries.map(([label, d], i) => ({
    key: i + 1, month: label,
    room: d.room, restaurant: d.restaurant, other: d.other,
    total: d.room + d.restaurant + d.other,
  }));
}

function getFilteredData(period, dateVal) {
  const entries = dateVal
    ? Object.entries(RAW).filter(([k]) => k.startsWith(dateVal))
    : Object.entries(RAW);
  if (entries.length === 0) return [];
  if (period === "day" && dateVal) {
    const d = entries[0][1];
    return [{ key: 1, month: dateVal, room: d.room, restaurant: d.restaurant, other: d.other, total: d.room + d.restaurant + d.other }];
  }
  const grouped = {};
  entries.forEach(([k, d]) => {
    const label = period === "monthly" ? k.slice(0, 7) : period === "year" ? k.slice(0, 4) : k.slice(0, 7);
    if (!grouped[label]) grouped[label] = { room: 0, restaurant: 0, other: 0 };
    grouped[label].room       += d.room;
    grouped[label].restaurant += d.restaurant;
    grouped[label].other      += d.other;
  });
  return buildRows(Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)));
}

const guestData = [
  { key: 1, name: "John Smith", email: "john@email.com",   phone: "+1 555-0101", visits: 5 },
  { key: 2, name: "Emma Lee",   email: "emma@email.com",   phone: "+1 555-0102", visits: 3 },
  { key: 3, name: "Carlos M.",  email: "carlos@email.com", phone: "+1 555-0103", visits: 7 },
  { key: 4, name: "Aisha K.",   email: "aisha@email.com",  phone: "+1 555-0104", visits: 2 },
];

const paymentData = [
  { key: 1, guest: "John Smith", amount: 1200, method: "Credit Card",   date: "2025-07-10", status: "Paid"     },
  { key: 2, guest: "Emma Lee",   amount: 850,  method: "Cash",          date: "2025-07-11", status: "Paid"     },
  { key: 3, guest: "Carlos M.",  amount: 1500, method: "Bank Transfer", date: "2025-07-12", status: "Pending"  },
  { key: 4, guest: "Aisha K.",   amount: 600,  method: "Credit Card",   date: "2025-07-09", status: "Refunded" },
];

// ── Shared dark-mode UI helpers ────────────────────────────────
function StatCard({ title, value, icon, color, dark }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-gray-400" : "text-gray-500"}`}>{title}</span>
        <span className="text-xl" style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function Card({ title, children, dark, className = "" }) {
  return (
    <div className={`rounded-xl border overflow-hidden ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"} ${className}`}>
      {title && (
        <div className={`px-5 py-3 border-b text-sm font-semibold ${dark ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-800"}`}>
          {title}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function SimpleTable({ columns, data, dark }) {
  const th = `px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${dark ? "text-gray-400 bg-gray-700/60" : "text-gray-500 bg-gray-50"}`;
  const td = `px-4 py-3 text-sm whitespace-nowrap ${dark ? "text-gray-300" : "text-gray-700"}`;
  const tr = `border-b ${dark ? "border-gray-700 hover:bg-gray-700/40" : "border-gray-100 hover:bg-gray-50"} transition-colors`;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead><tr>{columns.map(c => <th key={c.key} className={th}>{c.title}</th>)}</tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.key ?? i} className={tr}>
              {columns.map(c => (
                <td key={c.key} className={td}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ value, dark }) {
  const map = {
    confirmed: { light: "bg-green-100 text-green-700",  dark: "bg-green-900/40 text-green-400" },
    pending:   { light: "bg-yellow-100 text-yellow-700", dark: "bg-yellow-900/40 text-yellow-400" },
    cancelled: { light: "bg-red-100 text-red-700",       dark: "bg-red-900/40 text-red-400" },
    completed: { light: "bg-blue-100 text-blue-700",     dark: "bg-blue-900/40 text-blue-400" },
    Paid:      { light: "bg-green-100 text-green-700",  dark: "bg-green-900/40 text-green-400" },
    Pending:   { light: "bg-yellow-100 text-yellow-700", dark: "bg-yellow-900/40 text-yellow-400" },
    Refunded:  { light: "bg-red-100 text-red-700",       dark: "bg-red-900/40 text-red-400" },
  };
  const s = map[value] ?? map.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dark ? s.dark : s.light}`}>
      {value?.charAt(0).toUpperCase() + value?.slice(1)}
    </span>
  );
}

// ── Chart tooltip ──────────────────────────────────────────────
function DarkTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${dark ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-200 text-gray-700"}`}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: ${p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
}

// ── Reservation Tab ────────────────────────────────────────────
function ReservationTab({ dark }) {
  const [stats,    setStats]    = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const res = await request("admin/bookings", "get");
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

  useEffect(() => { load(); }, []);

  const openEdit = (r) => { setEditing(r); form.setFieldsValue({ status: r.status }); setModal(true); };
  const handleDelete = async (id) => {
    const res = await request(`admin/bookings/${id}`, "delete");
    if (res?.message) { message.success("Booking deleted"); load(); }
    else message.error("Failed to delete");
  };
  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/bookings/${editing.id}`, "put", values);
    setSaving(false);
    if (res?.message) { message.success("Updated"); setModal(false); load(); }
    else message.error("Failed to update");
  };

  const columns = [
    { key: "guest",    title: "Guest",    render: (_, r) => r.user?.name ?? "—" },
    { key: "room",     title: "Room",     render: (_, r) => r.rooms?.[0]?.room_number ?? "—" },
    { key: "check_in", title: "Check-in" },
    { key: "check_out",title: "Check-out" },
    { key: "status",   title: "Status",   render: (v) => <StatusBadge value={v} dark={dark} /> },
    { key: "action",   title: "Action",   render: (_, r) => (
      <ActionButtons onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} deleteMsg="Delete this booking?" />
    )},
  ];

  return (
    <Spin spinning={loading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Reservations" value={stats.total}     icon={<CalendarOutlined />}    color="#1677ff" dark={dark} />
        <StatCard title="Confirmed"          value={stats.confirmed} icon={<CheckCircleOutlined />} color="#52c41a" dark={dark} />
        <StatCard title="Pending"            value={stats.pending}   icon={<ClockCircleOutlined />} color="#faad14" dark={dark} />
        <StatCard title="Cancelled"          value={stats.cancelled} icon={<CloseCircleOutlined />} color="#ff4d4f" dark={dark} />
      </div>
      <Card title="Recent Reservations" dark={dark}>
        <SimpleTable columns={columns} data={bookings.slice(0, 10)} dark={dark} />
      </Card>
      <Modal title="Edit Booking" open={modal} onOk={handleSave} onCancel={() => setModal(false)} confirmLoading={saving} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
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
  const columns = [
    { key: "name",   title: "Name",   render: (v) => <span className="flex items-center gap-2"><UserOutlined />{v}</span> },
    { key: "email",  title: "Email"  },
    { key: "phone",  title: "Phone"  },
    { key: "visits", title: "Visits" },
  ];
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Guests"     value={342} icon={<TeamOutlined />} color="#1677ff" dark={dark} />
        <StatCard title="New This Month"   value={28}  icon={<UserOutlined />} color="#52c41a" dark={dark} />
        <StatCard title="Returning Guests" value={314} icon={<UserOutlined />} color="#722ed1" dark={dark} />
      </div>
      <Card title="Guest List" dark={dark}>
        <SimpleTable columns={columns} data={guestData} dark={dark} />
      </Card>
    </>
  );
}

// ── Payment Tab ────────────────────────────────────────────────
function PaymentTab({ dark }) {
  const columns = [
    { key: "guest",  title: "Guest"  },
    { key: "amount", title: "Amount", render: v => `$${v.toLocaleString()}` },
    { key: "method", title: "Method" },
    { key: "date",   title: "Date"   },
    { key: "status", title: "Status", render: v => <StatusBadge value={v} dark={dark} /> },
  ];
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Collected" value="$4,150" icon={<DollarOutlined />} color="#52c41a" dark={dark} />
        <StatCard title="Pending"         value="$1,500" icon={<DollarOutlined />} color="#faad14" dark={dark} />
        <StatCard title="Refunded"        value="$600"   icon={<DollarOutlined />} color="#ff4d4f" dark={dark} />
      </div>
      <Card title="Payment Records" dark={dark}>
        <SimpleTable columns={columns} data={paymentData} dark={dark} />
      </Card>
    </>
  );
}

// ── Revenue Tab ────────────────────────────────────────────────
function RevenueTab({ dark }) {
  const [period,  setPeriod]  = useState("monthly");
  const [dateVal, setDateVal] = useState("");

  const data     = getFilteredData(period, dateVal || null);
  const totalRev = data.reduce((a, r) => a + r.total, 0);
  const totalRoom= data.reduce((a, r) => a + r.room, 0);
  const avgRev   = data.length ? Math.round(totalRev / data.length) : 0;

  const axisColor  = dark ? "#6b7280" : "#9ca3af";
  const gridColor  = dark ? "#374151" : "#e5e7eb";
  const inputCls   = `border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
    dark ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"
  }`;
  const btnCls     = `px-3 py-1.5 text-sm rounded-lg border transition-colors ${
    dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
  }`;
  const periodBtnActive = `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#0f2744] text-white`;
  const periodBtn       = `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
    dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
  }`;

  const tableColumns = [
    { key: "month",      title: period === "day" ? "Day" : period === "monthly" ? "Month" : "Year" },
    { key: "room",       title: "Room Revenue", render: v => `$${v.toLocaleString()}` },
    { key: "restaurant", title: "Restaurant",   render: v => `$${v.toLocaleString()}` },
    { key: "other",      title: "Other",        render: v => `$${v.toLocaleString()}` },
    { key: "total",      title: "Total",        render: v => <strong>${v.toLocaleString()}</strong> },
  ];

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {["day", "monthly", "year"].map(p => (
              <button key={p} onClick={() => { setPeriod(p); setDateVal(""); }}
                className={period === p ? periodBtnActive : periodBtn}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <input
            type={period === "day" ? "date" : period === "monthly" ? "month" : "number"}
            value={dateVal}
            onChange={e => setDateVal(e.target.value)}
            placeholder={period === "year" ? "YYYY" : ""}
            min={period === "year" ? "2020" : undefined}
            max={period === "year" ? "2030" : undefined}
            className={inputCls}
          />
          <button onClick={() => setDateVal("")} className={btnCls}>Reset</button>
        </div>
        <button className={`${btnCls} flex items-center gap-1.5`}>
          <DownloadOutlined /> Export Report
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Customer"  value={280}                          icon={<TeamOutlined />}    color="#fa8c16" dark={dark} />
        <StatCard title="Total Check-in"  value={142}                          icon={<CalendarOutlined />} color="#1677ff" dark={dark} />
        <StatCard title="Total Check-out" value={138}                          icon={<CalendarOutlined />} color="#722ed1" dark={dark} />
        <StatCard title="Total Customer"  value={280}                          icon={<TeamOutlined />}    color="#fa8c16" dark={dark} />
        <StatCard title="Total Check-in"  value={142}                          icon={<CalendarOutlined />} color="#1677ff" dark={dark} />
        <StatCard title="Total Check-out" value={138}                          icon={<CalendarOutlined />} color="#722ed1" dark={dark} />
        <StatCard title="Total Check-out" value={138}                          icon={<CalendarOutlined />} color="#722ed1" dark={dark} />
        <StatCard title="Total Revenue"   value={`$${totalRev.toLocaleString()}`} icon={<DollarOutlined />}  color="#52c41a" dark={dark} />
      </div>

      {/* Bar chart */}
      <div>
      <Card title="Revenue by Category" dark={dark} className="mb-4">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
            <Tooltip content={<DarkTooltip dark={dark} />} />
            <Legend wrapperStyle={{ color: dark ? "#d1d5db" : "#374151", fontSize: 12 }} />
            <Bar dataKey="room"       name="Room"       fill="#1677ff" radius={[4,4,0,0]} />
            <Bar dataKey="restaurant" name="Restaurant" fill="#722ed1" radius={[4,4,0,0]} />
            <Bar dataKey="other"      name="Other"      fill="#fa8c16" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Line chart */}
      <Card title="Total Revenue Trend" dark={dark} className="mb-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
            <Tooltip content={<DarkTooltip dark={dark} />} />
            <Line type="monotone" dataKey="total" name="Total" stroke="#52c41a" strokeWidth={2} dot={{ r: 4, fill: "#52c41a" }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
            <ChartDataDashboard/>
      
      </div>

      {/* Revenue table */}
      <Card title={`${period === "day" ? "Day" : period === "monthly" ? "Month" : "Year"} Revenue Breakdown`} dark={dark}>
        {data.length === 0 ? (
          <p className={`text-sm text-center py-8 ${dark ? "text-gray-500" : "text-gray-400"}`}>No data for selected date</p>
        ) : (
          <>
            <SimpleTable columns={tableColumns} data={data} dark={dark} />
            {/* Summary row */}
            <div className={`flex gap-4 mt-3 pt-3 border-t text-sm font-semibold ${dark ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-800"}`}>
              <span>Total:</span>
              <span className="text-blue-500">${totalRoom.toLocaleString()} room</span>
              <span className="text-purple-500">${data.reduce((a,r)=>a+r.restaurant,0).toLocaleString()} restaurant</span>
              <span className="text-orange-500">${data.reduce((a,r)=>a+r.other,0).toLocaleString()} other</span>
              <span className="text-green-500">${totalRev.toLocaleString()} total</span>
            </div>
          </>
        )}
      </Card>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function DashboardOverview() {
  const dark = useDarkMode();

  const tabLabelCls = dark ? "text-gray-300" : "";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
      <Tabs
        defaultActiveKey="revenue"
        tabBarStyle={{
          marginBottom: 0,
          background: dark ? "#1f2937" : "#ffffff",
          borderRadius: "0.75rem 0.75rem 0 0",
          padding: "0 16px",
          borderBottom: dark ? "1px solid #374151" : "1px solid #e5e7eb",
        }}
        items={[
          {
            key: "revenue",
            label: <span className={tabLabelCls}><BarChartOutlined /> Revenue Analytics</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-gray-100"}`}><RevenueTab dark={dark} /></div>,
          },
          {
            key: "reservation",
            label: <span className={tabLabelCls}><CalendarOutlined /> Reservation</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-gray-100"}`}><ReservationTab dark={dark} /></div>,
          },
          {
            key: "guest",
            label: <span className={tabLabelCls}><TeamOutlined /> Guest</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-gray-100"}`}><GuestTab dark={dark} /></div>,
          },
          {
            key: "payment",
            label: <span className={tabLabelCls}><DollarOutlined /> Payment</span>,
            children: <div className={`pt-4 rounded-b-xl p-4 ${dark ? "bg-gray-900" : "bg-gray-100"}`}><PaymentTab dark={dark} /></div>,
          },
        ]}
      />
    </div>
  );
}
