import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDarkMode } from "../../util/DarkModeContext";

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

function CustomTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null;
  const revenue = payload[0]?.value ?? 0;

  return (
    <div
      className={`min-w-[200px] rounded-xl border px-4 py-3 shadow-xl ${
        dark
          ? "border-gray-700 bg-gray-900 text-gray-100"
          : "border-[#D9E2EC] bg-white text-[#102A43]"
      }`}
    >
      <p className={`mb-2 text-sm font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
        {label} — paid revenue
      </p>
      <p className={`text-sm font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
        {formatCurrency(revenue)}
      </p>
    </div>
  );
}

export default function AdminMonthlyRevenueChart({ monthlyRevenue = [], loading = false, year }) {
  const dark = useDarkMode();
  const chartRows = useMemo(() => normalizeMonthlyRows(monthlyRevenue), [monthlyRevenue]);

  const axisColor = dark ? "#9ca3af" : "#6b7280";
  const gridColor = dark ? "#374151" : "#e5e7eb";

  const subtitle = year
    ? `Monthly paid revenue (${year})`
    : "Monthly paid revenue";

  return (
    <div
      className={`w-full rounded-xl border p-5 shadow-sm transition-colors duration-200 ${
        dark ? "border-gray-700 bg-gray-800" : "border-[#D9E2EC] bg-white"
      }`}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            Revenue by month
          </h2>
          <p className={`mt-1 text-sm ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className={`text-sm ${dark ? "text-gray-300" : "text-[#486581]"}`}>Paid revenue</span>
        </div>
      </div>

      <div className="h-[350px] w-full">
        {loading ? (
          <div className={`h-full w-full rounded-lg animate-pulse ${dark ? "bg-gray-700/50" : "bg-slate-100"}`} />
        ) : chartRows.length === 0 ? (
          <div className={`flex h-full items-center justify-center text-sm ${dark ? "text-gray-400" : "text-slate-500"}`}>
            No paid revenue for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisColor, fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisColor, fontSize: 12 }}
                width={65}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                content={<CustomTooltip dark={dark} />}
                cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              />
              <Bar
                dataKey="revenue"
                name="Paid revenue"
                fill="#3b82f6"
                radius={[5, 5, 0, 0]}
                maxBarSize={14}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
