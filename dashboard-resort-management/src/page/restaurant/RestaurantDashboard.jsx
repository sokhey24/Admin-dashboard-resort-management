import { useEffect, useState } from "react";
import { Spin } from "antd";
import { MdRestaurantMenu, MdAttachMoney, MdTableRestaurant, MdStar } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import ChartCircle from "../Chart_Data/Chart_cirlce";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

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

function StatCard({ title, value, icon, color, dark }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{title}</span>
        <span className="text-xl" style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}


export default function RestaurantDashboard() {
  const dark = useDarkMode();
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    request("restaurant/dashboard", "get").then((res) => {
      if (res) setData(res);
      setLoading(false);
    });
  }, []);

  const stats = [
    { title: "Total Menu Items",   value: data.total_menu      ?? 0, icon: <MdRestaurantMenu />, color: "#1677ff" },
    { title: "Orders Today",       value: data.orders_today    ?? 0, icon: <MdRestaurantMenu />, color: "#52c41a" },
    { title: "Tables Reserved",    value: data.tables_reserved ?? 0, icon: <MdTableRestaurant />, color: "#faad14" },
    { title: "Revenue Today",      value: `$${data.revenue_today ?? 0}`, icon: <MdAttachMoney />, color: "#722ed1" },
    { title: "Pending Orders",     value: data.pending_orders  ?? 0, icon: <MdRestaurantMenu />, color: "#ff4d4f" },
    { title: "Completed Orders",   value: data.completed_orders ?? 0, icon: <MdRestaurantMenu />, color: "#13c2c2" },
    { title: "Average Rating",     value: data.average_rating  ?? 0, icon: <MdStar />,           color: "#faad14" },
    { title: "Total Revenue",      value: `$${data.total_revenue ?? 0}`, icon: <MdAttachMoney />, color: "#52c41a" },
  ];

  return (
    <Spin spinning={loading}>
      <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
        <h2 className={`text-[26px] font-bold mb-5 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Restaurant Dashboard</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {stats.map((s) => (
            <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} dark={dark} />
          ))}
        </div>
        {/* Data - filter */}
        {/* <DateFilter filter={filter} onChange={handleFilter} dark={dark} /> */}

        <div className={`rounded-xl border p-5 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Overview — same style as admin dashboard */}
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
                      <linearGradient id="ordersGradientR" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="orders" name="Orders" stroke="#fb923c" strokeWidth={2} fill="url(#ordersGradientR)" fillOpacity={1} activeDot={{ r: 5, fill: dark ? "#18181b" : "#ffffff", stroke: "#fb923c", strokeWidth: 3 }} animationDuration={1200} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Restaurant Sales */}
            <ChartCircle />
          </div>
        </div>
      </div>
    </Spin>
  );
}
