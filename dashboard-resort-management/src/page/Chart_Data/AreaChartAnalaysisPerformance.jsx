import { useMemo } from "react";
import { useDarkMode } from "../../util/DarkModeContext";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatCurrency = (value) => `$${Number(value).toLocaleString("en-US")}`;

function normalizeMonthlyRows(monthlyRevenue) {
  if (!Array.isArray(monthlyRevenue) || monthlyRevenue.length === 0) return [];

  const byKey = new Map();
  monthlyRevenue.forEach((row) => {
    const name = row.month;
    const idx = MONTH_ORDER.findIndex((m) => m.toLowerCase() === String(name).toLowerCase());
    const short = idx >= 0 ? MONTH_SHORT[idx] : String(name).slice(0, 3);
    byKey.set(short, { month: short, revenue: Number(row.revenue) || 0, sort: idx >= 0 ? idx : 99 });
  });

  return [...byKey.values()].sort((a, b) => a.sort - b.sort);
}

const CustomTooltip = ({ active, payload, label, dark }) => {
  if (!active || !payload?.length) return null;

  const revenue = payload[0]?.value ?? 0;

  return (
    <div
      className={`min-w-[220px] rounded-xl border px-4 py-3 shadow-xl ${
        dark
          ? "border-gray-700 bg-gray-900 text-gray-100"
          : "border-[#D9E2EC] bg-white text-[#102A43]"
      }`}
    >
      <p className={`mb-2 text-sm font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
        {label} — paid revenue
      </p>
      <p className="text-sm font-bold text-indigo-500">{formatCurrency(revenue)}</p>
    </div>
  );
};

export default function AreaChartAnalaysisPerformance({ monthlyRevenue = [], loading = false, year }) {
  const dark = useDarkMode();
  const data = useMemo(() => normalizeMonthlyRows(monthlyRevenue), [monthlyRevenue]);

  const bg = dark ? "#1f2937" : "#ffffff";
  const border = dark ? "#374151" : "#e5e7eb";
  const gridStroke = dark ? "#374151" : "#e5e7eb";
  const tickColor = dark ? "#d1d5db" : "#6b7280";
  const axisColor = dark ? "#4b5563" : "#d1d5db";
  const titleColor = dark ? "#f9fafb" : "#111827";
  const subColor = dark ? "#9ca3af" : "#6b7280";
  const legendColor = dark ? "#d1d5db" : "#374151";

  const subtitle = year
    ? `Paid revenue by month (${year}) from admin dashboard`
    : "Paid revenue by month from admin dashboard";

  return (
    <div
      className="w-full overflow-hidden rounded-xl border p-5 shadow-sm transition-colors duration-200"
      style={{ background: bg, borderColor: border }}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: titleColor }}>
            Revenue trend
          </h2>
          <p className="mt-1 text-sm" style={{ color: subColor }}>
            {subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span style={{ color: legendColor }}>Paid revenue</span>
          </div>
        </div>
      </div>

      <div className="h-[380px] w-full">
        {loading ? (
          <div
            className={`h-full w-full rounded-lg animate-pulse ${dark ? "bg-gray-700/50" : "bg-slate-100"}`}
          />
        ) : data.length === 0 ? (
          <div
            className={`flex h-full items-center justify-center text-sm ${dark ? "text-gray-400" : "text-slate-500"}`}
          >
            No paid revenue for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="paidRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} opacity={0.8} />
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
                width={65}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                content={<CustomTooltip dark={dark} />}
                cursor={{ stroke: dark ? "#6b7280" : "#d1d5db", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Paid revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#paidRevenueGradient)"
                fillOpacity={1}
                activeDot={{
                  r: 5,
                  fill: dark ? "#18181b" : "#ffffff",
                  stroke: "#6366f1",
                  strokeWidth: 3,
                }}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
