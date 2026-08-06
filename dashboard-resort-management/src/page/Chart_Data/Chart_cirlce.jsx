import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../../util/DarkModeContext';

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 500 },
  { name: 'Group D', value: 200 },
  { name: 'Group E', value: 278 },
  { name: 'Group F', value: 189 },
];

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#ff8042'];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ChartCircle() {
  const dark = useDarkMode();
  return (
    <div className={`w-full rounded-xl shadow p-5 transition-colors duration-200 ${dark ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className={`text-base font-semibold mb-4 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Resort Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={110}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value}`, name]}
            contentStyle={{
              background: dark ? '#1f2937' : '#ffffff',
              border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: dark ? '#e5e7eb' : '#374151',
            }}
          />
          <Legend wrapperStyle={{ color: dark ? '#d1d5db' : '#374151', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}