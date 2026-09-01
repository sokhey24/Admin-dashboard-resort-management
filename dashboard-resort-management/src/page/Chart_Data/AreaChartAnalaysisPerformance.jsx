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

const data = [
  { month: "Jan", resortRevenue: 18500, restaurantRevenue: 6200 },
  { month: "Feb", resortRevenue: 22400, restaurantRevenue: 7100 },
  { month: "Mar", resortRevenue: 25800, restaurantRevenue: 8300 },
  { month: "Apr", resortRevenue: 23100, restaurantRevenue: 7900 },
  { month: "May", resortRevenue: 29500, restaurantRevenue: 9200 },
  { month: "Jun", resortRevenue: 32800, restaurantRevenue: 10500 },
  { month: "Jul", resortRevenue: 35600, restaurantRevenue: 11800 },
  { month: "Aug", resortRevenue: 38200, restaurantRevenue: 12600 },
  { month: "Sep", resortRevenue: 33400, restaurantRevenue: 10900 },
  { month: "Oct", resortRevenue: 36800, restaurantRevenue: 12100 },
  { month: "Nov", resortRevenue: 40500, restaurantRevenue: 13400 },
  { month: "Dec", resortRevenue: 46800, restaurantRevenue: 15800 },
];

const formatCurrency = (value) => {
  return `$${Number(value).toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label, dark }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const resortRevenue =
    payload.find((item) => item.dataKey === "resortRevenue")?.value ?? 0;

  const restaurantRevenue =
    payload.find((item) => item.dataKey === "restaurantRevenue")?.value ?? 0;

  const totalRevenue = resortRevenue + restaurantRevenue;

  const resortPercentage =
    totalRevenue > 0
      ? ((resortRevenue / totalRevenue) * 100).toFixed(1)
      : 0;

  const restaurantPercentage =
    totalRevenue > 0
      ? ((restaurantRevenue / totalRevenue) * 100).toFixed(1)
      : 0;

  return (
    <div
      className={`min-w-[260px] rounded-xl border px-4 py-3 shadow-xl ${
        dark
          ? "border-gray-700 bg-gray-900 text-gray-100"
          : "border-[#D9E2EC] bg-white text-[#102A43]"
      }`}
    >
      {/* Month */}
      <p
        className={`mb-3 text-sm font-semibold ${
          dark ? "text-gray-100" : "text-[#102A43]"
        }`}
      >
        {label} Revenue
      </p>

      {/* Resort */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />

            <span
              className={`text-sm ${
                dark ? "text-gray-300" : "text-[#486581]"
              }`}
            >
              Resort Cash
            </span>
          </div>

          <span className="text-sm font-semibold">
            {formatCurrency(resortRevenue)}
          </span>
        </div>

        <p
          className={`mt-1 ml-4 text-xs ${
            dark ? "text-[#829AB1]" : "text-gray-400"
          }`}
        >
          {resortPercentage}% of total revenue
        </p>
      </div>

      {/* Restaurant */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

            <span
              className={`text-sm ${
                dark ? "text-gray-300" : "text-[#486581]"
              }`}
            >
              Restaurant Cash
            </span>
          </div>

          <span className="text-sm font-semibold">
            {formatCurrency(restaurantRevenue)}
          </span>
        </div>

        <p
          className={`mt-1 ml-4 text-xs ${
            dark ? "text-[#829AB1]" : "text-gray-400"
          }`}
        >
          {restaurantPercentage}% of total revenue
        </p>
      </div>

      {/* Total */}
      <div
        className={`flex items-center justify-between border-t border-dashed pt-3 ${
          dark ? "border-gray-700" : "border-[#D9E2EC]"
        }`}
      >
        <span
          className={`text-sm font-semibold ${
            dark ? "text-gray-300" : "text-[#486581]"
          }`}
        >
          Total Cash Revenue
        </span>

        <span className="text-sm font-bold text-indigo-500">
          {formatCurrency(totalRevenue)}
        </span>
      </div>
    </div>
  );
};

export default function AreaChartAnalaysisPerformance() {
  const dark = useDarkMode();

  const bg = dark ? "#1f2937" : "#ffffff";
  const border = dark ? "#374151" : "#e5e7eb";
  const gridStroke = dark ? "#374151" : "#e5e7eb";
  const tickColor = dark ? "#d1d5db" : "#6b7280";
  const axisColor = dark ? "#4b5563" : "#d1d5db";
  const titleColor = dark ? "#f9fafb" : "#111827";
  const subColor = dark ? "#9ca3af" : "#6b7280";
  const legendColor = dark ? "#d1d5db" : "#374151";

  return (
    <div
      className="w-full overflow-hidden rounded-xl border p-5 shadow-sm transition-colors duration-200"
      style={{
        background: bg,
        borderColor: border,
      }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: titleColor }}
          >
            Revenue Analysis
          </h2>

          <p
            className="mt-1 text-sm"
            style={{ color: subColor }}
          >
            Monthly cash revenue comparison between resort and restaurant
          </p>
        </div>

        {/* Revenue Legend */}
        <div className="flex flex-wrap gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />

            <span style={{ color: legendColor }}>
              Resort Cash
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

            <span style={{ color: legendColor }}>
              Restaurant Cash
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            {/* Gradients */}
            <defs>
              <linearGradient
                id="resortRevenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#6366f1"
                  stopOpacity={0.5}
                />

                <stop
                  offset="100%"
                  stopColor="#6366f1"
                  stopOpacity={0.03}
                />
              </linearGradient>

              <linearGradient
                id="restaurantRevenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#4ade80"
                  stopOpacity={0.5}
                />

                <stop
                  offset="100%"
                  stopColor="#4ade80"
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>

            {/* Grid */}
            <CartesianGrid
              stroke={gridStroke}
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.8}
            />

            {/* Month */}
            <XAxis
              dataKey="month"
              axisLine={{ stroke: axisColor }}
              tickLine={false}
              tick={{
                fill: tickColor,
                fontSize: 12,
              }}
            />

            {/* Cash */}
            <YAxis
              axisLine={{ stroke: axisColor }}
              tickLine={false}
              tick={{
                fill: tickColor,
                fontSize: 12,
              }}
              width={65}
              tickFormatter={(value) => `$${value / 1000}k`}
            />

            {/* Tooltip */}
            <Tooltip
              content={<CustomTooltip dark={dark} />}
              cursor={{
                stroke: dark ? "#6b7280" : "#d1d5db",
                strokeWidth: 1,
              }}
            />

            {/* Resort Cash Revenue */}
            <Area
              type="monotone"
              dataKey="resortRevenue"
              name="Resort Cash"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#resortRevenueGradient)"
              fillOpacity={1}
              activeDot={{
                r: 5,
                fill: dark ? "#18181b" : "#ffffff",
                stroke: "#6366f1",
                strokeWidth: 3,
              }}
              animationDuration={1200}
            />

            {/* Restaurant Cash Revenue */}
            <Area
              type="monotone"
              dataKey="restaurantRevenue"
              name="Restaurant Cash"
              stroke="#4ade80"
              strokeWidth={2.5}
              fill="url(#restaurantRevenueGradient)"
              fillOpacity={1}
              activeDot={{
                r: 5,
                fill: dark ? "#18181b" : "#ffffff",
                stroke: "#4ade80",
                strokeWidth: 3,
              }}
              animationDuration={1400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}