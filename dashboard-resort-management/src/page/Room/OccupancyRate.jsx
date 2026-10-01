import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Spin } from "antd";
import { useDarkMode } from "../../util/DarkModeContext";
import { request } from "../../util/request";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

function normalizeTrend(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      date: row?.date ?? "",
      label: row?.label ?? row?.date ?? "",
      rate: Number(row?.rate ?? 0),
      occupied: Number(row?.occupied ?? row?.active_stays ?? 0),
      sellable: Number(row?.sellable ?? 0),
    }))
    .filter((row) => row.date || row.label);
}

export default function OccupancyRate() {
  const dark = useDarkMode();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    request("resort/dashboard", "get")
      .then((res) => {
        if (res?.errors) {
          setSummary(null);
          setError(res.errors.message ?? "Unable to load occupancy data.");
          return;
        }
        if (res) {
          setSummary(res);
        } else {
          setSummary(null);
          setError("Unable to load occupancy data.");
        }
      })
      .catch(() => {
        setSummary(null);
        setError("Unable to load occupancy data.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = normalizeTrend(summary?.occupancy_trend);
  const occupied = Number(summary?.rooms_occupied ?? 0);
  const available = Number(summary?.rooms_available ?? 0);
  const maintenance = Number(summary?.rooms_maintenance ?? 0);
  const rate = Number(summary?.occupancy_rate ?? 0);

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

  const period = summary?.occupancy_trend_period;
  const periodHint = period?.date_from && period?.date_to
    ? `${period.date_from} — ${period.date_to}`
    : null;

  return (
    <div
      className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
    >
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Occupancy Rate</h2>

      {error && !loading && (
        <div className={`rounded-xl border p-4 mb-4 ${card}`}>
          <p className={`text-sm mb-3 ${subText}`}>{error}</p>
          <Button type="primary" onClick={load}>Retry</Button>
        </div>
      )}

      <Spin spinning={loading}>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 shadow-sm ${card}`}>
              <p className={`text-[13px] font-semibold uppercase tracking-wide mb-1 ${subText}`}>{s.label}</p>
              {loading ? (
                <div className={`h-9 w-24 rounded animate-pulse ${dark ? "bg-gray-700" : "bg-[#EEF2F6]"}`} />
              ) : (
                <p className="text-[28px] font-bold" style={{ color: s.color }}>{s.value}</p>
              )}
            </div>
          ))}
        </div>
        <div className={`rounded-xl border shadow-sm p-5 ${card}`}>
          <div className="mb-4">
            <p className={`text-[18px] font-semibold ${titleCls}`}>Occupancy Rate Trend</p>
            {periodHint && (
              <p className={`text-[13px] mt-1 ${subText}`}>{periodHint}</p>
            )}
          </div>
          {!loading && chartData.length === 0 ? (
            <Empty description="No occupancy history available." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: axisClr, fontSize: 12 }}
                  axisLine={{ stroke: gridClr }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fill: axisClr, fontSize: 12 }}
                  axisLine={{ stroke: gridClr }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v)}%`, "Occupancy"]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload;
                    return row?.date ?? row?.label ?? "";
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#FF6B00"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#FF6B00" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Spin>
    </div>
  );
}
