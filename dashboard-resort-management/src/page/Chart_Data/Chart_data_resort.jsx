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

const data = [
  { month: "Jan", revenue: 18500 },
  { month: "Feb", revenue: 22400 },
  { month: "Mar", revenue: 25800 },
  { month: "Apr", revenue: 23100 },
  { month: "May", revenue: 29500 },
  { month: "Jun", revenue: 32800 },
  { month: "Jul", revenue: 35600 },
  { month: "Aug", revenue: 38200 },
  { month: "Sep", revenue: 33400 },
  { month: "Oct", revenue: 36800 },
  { month: "Nov", revenue: 40500 },
  { month: "Dec", revenue: 46800 },
];

const formatCurrency = (value) => {
  return `$${Number(value).toLocaleString()}`;
};

function CustomTooltip({ active, payload, label, dark }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const revenue = payload[0]?.value ?? 0;

  return (
    <div
      className={`min-w-[200px] rounded-xl border px-4 py-3 shadow-xl ${
        dark
          ? "border-gray-700 bg-gray-900 text-gray-100"
          : "border-[#D9E2EC] bg-white text-[#102A43]"
      }`}
    >
      <p
        className={`mb-3 text-sm font-semibold ${
          dark ? "text-gray-100" : "text-[#102A43]"
        }`}
      >
        {label} Revenue
      </p>

      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />

          <span
            className={`text-sm ${
              dark ? "text-gray-300" : "text-[#486581]"
            }`}
          >
            Resort Revenue
          </span>
        </div>

        <span
          className={`text-sm font-semibold ${
            dark ? "text-gray-100" : "text-[#102A43]"
          }`}
        >
          {formatCurrency(revenue)}
        </span>
      </div>
    </div>
  );
}

export default function Chart_data_resort() {
  const dark = useDarkMode();

  const axisColor = dark ? "#9ca3af" : "#6b7280";
  const gridColor = dark ? "#374151" : "#e5e7eb";

  return (
    <div
      className={`w-full rounded-xl border p-5 shadow-sm transition-colors duration-200 ${
        dark
          ? "border-gray-700 bg-gray-800"
          : "border-[#D9E2EC] bg-white"
      }`}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className={`text-lg font-semibold ${
              dark ? "text-gray-100" : "text-[#102A43]"
            }`}
          >
            Revenue Analysis
          </h2>

          <p
            className={`mt-1 text-sm ${
              dark ? "text-gray-400" : "text-[#829AB1]"
            }`}
          >
            Monthly revenue generated from resort bookings
          </p>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />

          <span
            className={`text-sm ${
              dark ? "text-gray-300" : "text-[#486581]"
            }`}
          >
            Resort Revenue
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={gridColor}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: axisColor,
                fontSize: 12,
              }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: axisColor,
                fontSize: 12,
              }}
              width={65}
              tickFormatter={(value) => `$${value / 1000}k`}
            />

            <Tooltip
              content={<CustomTooltip dark={dark} />}
              cursor={{
                fill: dark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
              }}
            />

            <Bar
              dataKey="revenue"
              name="Resort Revenue"
              fill="#3b82f6"
              radius={[5, 5, 0, 0]}
              maxBarsize={14}
              animationDuration={1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}