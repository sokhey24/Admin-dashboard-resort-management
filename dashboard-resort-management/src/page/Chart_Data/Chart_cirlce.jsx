import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDarkMode } from "../../util/DarkModeContext";

const data = [
  { name: "Khmer Food", value: 28 },
  { name: "Asian Food", value: 22 },
  { name: "Western Food", value: 18 },
  { name: "Seafood", value: 14 },
  { name: "Drinks", value: 12 },
  { name: "Desserts", value: 6 },
];

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const radius =
    innerRadius + (outerRadius - innerRadius) * 0.5;

  const x =
    cx + radius * Math.cos(-midAngle * RADIAN);

  const y =
    cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontsize={14}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, dark }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div
      className={`min-w-[170px] rounded-xl border px-4 py-3 shadow-xl ${
        dark
          ? "border-gray-700 bg-gray-900 text-gray-100"
          : "border-[#D9E2EC] bg-white text-[#102A43]"
      }`}
    >
      <p className="text-sm font-semibold">
        {item.name}
      </p>

      <p
        className={`mt-1 text-sm ${
          dark ? "text-gray-300" : "text-[#486581]"
        }`}
      >
        Sales:{" "}
        <span className="font-semibold">
          {item.value}%
        </span>
      </p>
    </div>
  );
};

export default function ChartCircleRestaurant() {
  const dark = useDarkMode();

  return (
    <div
      className={`w-full rounded-xl border p-5 shadow-sm transition-colors duration-200 ${
        dark
          ? "border-gray-700 bg-gray-800"
          : "border-[#D9E2EC] bg-white"
      }`}
    >
      {/* Header */}
      <div className="mb-2">
        <h2
          className={`text-lg font-semibold ${
            dark ? "text-gray-100" : "text-[#102A43]"
          }`}
        >
          Restaurant Sales
        </h2>

        <p
          className={`mt-1 text-sm ${
            dark ? "text-gray-400" : "text-[#829AB1]"
          }`}
        >
          Sales distribution by food category
        </p>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={105}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              content={<CustomTooltip dark={dark} />}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{
                color: dark ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}