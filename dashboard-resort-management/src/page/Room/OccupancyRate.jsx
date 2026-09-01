import { useDarkMode } from "../../util/DarkModeContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", rate: 65 }, { month: "Feb", rate: 72 },
  { month: "Mar", rate: 80 }, { month: "Apr", rate: 68 },
  { month: "May", rate: 88 }, { month: "Jun", rate: 75 },
  { month: "Jul", rate: 92 },
];

const STATS = [
  { label: "Current Rate",    value: "92%", color: "#52c41a" },
  { label: "Monthly Average", value: "77%", color: "#1677ff" },
  { label: "Yearly Average",  value: "74%", color: "#722ed1" },
];

export default function OccupancyRate() {
  const dark = useDarkMode();

  const card     = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText  = dark ? "text-gray-400" : "text-[#829AB1]";
  const axisClr  = dark ? "#6b7280" : "#9ca3af";
  const gridClr  = dark ? "#374151" : "#e5e7eb";

  return (
    <div
      className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
    >
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Occupancy Rate</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className={`rounded-xl border p-4 shadow-sm ${card}`}>
            <p className={`text-[13px] font-semibold uppercase tracking-wide mb-1 ${subText}`}>{s.label}</p>
            <p className="text-[28px] font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className={`rounded-xl border shadow-sm p-5 ${card}`}>
        <p className={`text-[18px] font-semibold mb-4 ${titleCls}`}>Occupancy Rate Trend</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
            <XAxis dataKey="month" tick={{ fill: axisClr, fontSize: 12 }} axisLine={{ stroke: gridClr }} tickLine={false} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fill: axisClr, fontSize: 12 }} axisLine={{ stroke: gridClr }} tickLine={false} width={40} />
            <Tooltip
              formatter={(v) => [`${v}%`, "Rate"]}
              contentStyle={{
                backgroundColor: dark ? "#1f2937" : "#ffffff",
                border: `1px solid ${dark ? "#374151" : "#D9E2EC"}`,
                borderRadius: 8,
                color: dark ? "#f3f4f6" : "#102A43",
                fontSize: 13,
              }}
            />
            <Line
              type="monotone" dataKey="rate" stroke="#FF6B00"
              strokeWidth={2} dot={{ r: 4, fill: "#FF6B00" }}
              activeDot={{ r: 6, fill: "#FF6B00" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
