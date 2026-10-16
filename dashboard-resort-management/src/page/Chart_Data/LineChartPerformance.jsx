import { useMemo } from "react";
import { useDarkMode } from "../../util/DarkModeContext";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function normalizePerformanceRows(monthlyPerformance) {
  if (!Array.isArray(monthlyPerformance) || monthlyPerformance.length === 0) return [];

  return monthlyPerformance
    .map((row) => {
      const name = row.month;
      const idx = MONTH_ORDER.findIndex((m) => m.toLowerCase() === String(name).toLowerCase());
      const short = idx >= 0 ? MONTH_SHORT[idx] : String(name).slice(0, 3);

      return {
        month: short,
        sort: idx >= 0 ? idx : 99,
        resortBookings: Number(row.bookings ?? 0),
        restaurantOrders: Number(row.restaurant_orders ?? 0),
      };
    })
    .sort((a, b) => a.sort - b.sort);
}

export default function LineChartPerformance({ monthlyPerformance = [], loading = false, year }) {
  const dark = useDarkMode();
  const data = useMemo(() => normalizePerformanceRows(monthlyPerformance), [monthlyPerformance]);

  const bg          = dark ? "#1f2937" : "#ffffff";
  const border      = dark ? "#374151" : "#e5e7eb";
  const gridStroke  = dark ? "#374151" : "#e5e7eb";
  const tickColor   = dark ? "#d1d5db" : "#6b7280";
  const axisColor   = dark ? "#9ca3af" : "#d1d5db";
  const tooltipBg   = dark ? "#18181b" : "#ffffff";
  const tooltipBdr  = dark ? "#374151" : "#e5e7eb";
  const tooltipClr  = dark ? "#ffffff" : "#111827";
  const tooltipItem = dark ? "#d1d5db" : "#374151";
  const titleColor  = dark ? "#f9fafb" : "#111827";
  const subColor    = dark ? "#9ca3af" : "#6b7280";
  const legendColor = dark ? "#d1d5db" : "#374151";
  const dotFill     = dark ? "#18181b" : "#ffffff";

  const subtitle = year
    ? `Monthly bookings and restaurant orders (${year})`
    : "Monthly bookings and restaurant orders";

  return (
    <div
      className="w-full overflow-hidden rounded-xl border p-5 shadow-sm transition-colors duration-200"
      style={{ background: bg, borderColor: border }}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: titleColor }}>
            Resort & Restaurant Performance
          </h2>
          <p className="mt-1 text-sm" style={{ color: subColor }}>
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span style={{ color: legendColor }}>Resort Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span style={{ color: legendColor }}>Restaurant Orders</span>
          </div>
        </div>
      </div>

      <div className="h-[380px] w-full">
        {loading ? (
          <div className={`h-full w-full rounded-lg animate-pulse ${dark ? "bg-gray-700/50" : "bg-slate-100"}`} />
        ) : data.length === 0 ? (
          <div className={`flex h-full items-center justify-center text-sm ${dark ? "text-gray-400" : "text-slate-500"}`}>
            No booking or order data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="resortGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#818cf8" stopOpacity={0.75} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="restaurantGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#86efac" stopOpacity={0.75} />
                  <stop offset="100%" stopColor="#86efac" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" opacity={0.8} />

              <XAxis
                dataKey="month"
                axisLine={{ stroke: axisColor }}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
              />

              <YAxis
                axisLine={{ stroke: axisColor }}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
                width={45}
                allowDecimals={false}
              />

              <Tooltip
                cursor={{ stroke: dark ? "#6b7280" : "#d1d5db", strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBdr}`,
                  borderRadius: "8px",
                  color: tooltipClr,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                }}
                labelStyle={{ color: tooltipClr, fontWeight: 600, marginBottom: "6px" }}
                itemStyle={{ color: tooltipItem }}
              />

              <Area
                type="monotone"
                dataKey="resortBookings"
                name="Resort Bookings"
                stroke="#818cf8"
                strokeWidth={2}
                fill="url(#resortGradient)"
                fillOpacity={1}
                activeDot={{ r: 5, fill: dotFill, stroke: "#818cf8", strokeWidth: 3 }}
                animationDuration={1200}
              />

              <Area
                type="monotone"
                dataKey="restaurantOrders"
                name="Restaurant Orders"
                stroke="#86efac"
                strokeWidth={2}
                fill="url(#restaurantGradient)"
                fillOpacity={1}
                activeDot={{ r: 5, fill: dotFill, stroke: "#86efac", strokeWidth: 3 }}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
