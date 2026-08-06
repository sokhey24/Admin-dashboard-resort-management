import { Bar, BarChart, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../../util/DarkModeContext';

const data = [
  { name: 'Jan', uv: 400,  pv: 2400 },
  { name: 'Feb', uv: 300,  pv: 4567 },
  { name: 'Mar', uv: 300,  pv: 1398 },
  { name: 'Apr', uv: 200,  pv: 9800 },
  { name: 'May', uv: 278,  pv: 3908 },
  { name: 'Jun', uv: 189,  pv: 4800 },
];

function CustomTooltip({ payload, label, active, dark }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={`rounded-lg px-4 py-3 shadow-md border ${dark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-red-300 text-gray-800'}`}>
      <p className="font-bold mb-1">{`${label} : ${payload[0].value}`}</p>
      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>UV value for {label}</p>
      <p className={`text-xs border-t border-dashed mt-1 pt-1 ${dark ? 'border-gray-600 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
        Anything you want can be displayed here.
      </p>
    </div>
  );
}

export default function Chart_data_resort() {
  const dark = useDarkMode();
  const axisColor = dark ? '#6b7280' : '#9ca3af';
  const gridColor = dark ? '#374151' : '#e5e7eb';

  return (
    <div className={`w-full rounded-xl shadow p-5 transition-colors duration-200 ${dark ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className={`text-base font-semibold mb-4 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Resort Chart Data</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} />
          <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
          <Tooltip content={<CustomTooltip dark={dark} />} />
          <Legend wrapperStyle={{ color: dark ? '#d1d5db' : '#374151', fontSize: 12 }} />
          <Bar dataKey="uv" name="UV" fill="#8884d8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pv" name="PV" fill="#82ca9d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}