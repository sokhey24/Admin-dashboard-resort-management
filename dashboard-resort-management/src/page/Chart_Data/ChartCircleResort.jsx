import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDarkMode } from "../../util/DarkModeContext";

// Resort booking data
const data = [
  { name: "Deluxe Room", value: 28 },
  { name: "Standard Room", value: 22 },
  { name: "Suite", value: 18 },
  { name: "Villa", value: 14 },
  { name: "Family Room", value: 12 },
  { name: "Other", value: 6 },
];

// Chart colors
const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

const RADIAN = Math.PI / 180;

// Custom percentage label
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
      fontSize={14}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, dark }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div
      className={`min-w-[180px] rounded-xl border px-4 py-3 shadow-xl ${
        dark
          ? "border-gray-700 bg-gray-900 text-gray-100"
          : "border-[#D9E2EC] bg-white text-[#102A43]"
      }`}
    >
      {/* Room Type */}
      <p className="text-sm font-semibold">
        {item.name}
      </p>

      {/* Booking Percentage */}
      <p
        className={`mt-1 text-sm ${
          dark ? "text-gray-300" : "text-[#486581]"
        }`}
      >
        Bookings:{" "}
        <span className="font-semibold">
          {item.value}%
        </span>
      </p>
    </div>
  );
};

export default function ChartCircleResort() {
  const dark = useDarkMode();

  return (
    <div
      className={`w-full rounded-xl  p-5  transition-colors duration-200 ${
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
          Resort Bookings
        </h2>

        <p
          className={`mt-1 text-sm ${
            dark ? "text-gray-400" : "text-[#829AB1]"
          }`}
        >
          Booking distribution by room type
        </p>
      </div>

      {/* Chart */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
        cx="50%"
        cy="45%"
        outerRadius={100}
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

            {/* Tooltip */}
            <Tooltip
              content={<CustomTooltip dark={dark} />}
            />

            {/* Legend */}
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

