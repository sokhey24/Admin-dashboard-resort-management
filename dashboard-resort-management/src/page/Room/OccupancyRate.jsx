import { useEffect, useState } from "react";
import { useDarkMode } from "../../util/DarkModeContext";
import { request } from "../../util/request";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export default function OccupancyRate() {
  const dark = useDarkMode();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    request("resort/dashboard", "get").then((res) => {
      if (res && !res.errors) {
        setSummary(res);
        const monthly = Array.isArray(res.monthly_revenue) ? res.monthly_revenue : [];
        setTrend(monthly.map((row) => ({
          month: String(row.month ?? "").slice(0, 3),
          rate: Number(res.occupancy_rate ?? 0),
        })));
      }
    });
  }, []);

  const occupied = Number(summary?.rooms_occupied ?? 0);
  const available = Number(summary?.rooms_available ?? 0);
  const maintenance = Number(summary?.rooms_maintenance ?? 0);
  const rate = Number(summary?.occupancy_rate ?? 0);
  const chartData = trend.length
    ? trend
    : [{ month: "Now", rate }];

  const card     = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText  = dark ? "text-gray-400" : "text-[#829AB1]";
  const axisClr  = dark ? "#6b7280" : "#9ca3af";
  const gridClr  = dark ? "#374151" : "#e5e7eb";

  const stats = [
    { label: "Current Rate", value: `${rate}%`, color: "#52c41a" },
    { label: "Occupied / Available", value: `${occupied} / ${available}`, color: "#1677ff" },
    { label: "Maintenance", value: String(maintenance), color: "#faad14" },
  ];

  return (
    <div
      className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
    >
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Occupancy Rate</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl border p-4 shadow-sm ${card}`}>
            <p className={`text-[13px] font-semibold uppercase tracking-wide mb-1 ${subText}`}>{s.label}</p>
            <p className="text-[28px] font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className={`rounded-xl border shadow-sm p-5 ${card}`}>
        <p className={`text-[18px] font-semibold mb-4 ${titleCls}`}>Occupancy (live)</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
            <XAxis dataKey="month" tick={{ fill: axisClr, fontSize: 12 }} axisLine={{ stroke: gridClr }} tickLine={false} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fill: axisClr, fontSize: 12 }} axisLine={{ stroke: gridClr }} tickLine={false} width={40} />
            <Tooltip formatter={(v) => [`${v}%`, "Rate"]} />
            <Line type="monotone" dataKey="rate" stroke="#FF6B00" strokeWidth={2} dot={{ r: 4, fill: "#FF6B00" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
