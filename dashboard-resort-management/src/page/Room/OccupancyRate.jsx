import { Card, Statistic } from "antd";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", rate: 65 }, { month: "Feb", rate: 72 },
  { month: "Mar", rate: 80 }, { month: "Apr", rate: 68 },
  { month: "May", rate: 88 }, { month: "Jun", rate: 75 },
  { month: "Jul", rate: 92 },
];

export default function OccupancyRate() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Occupancy Rate</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><Statistic title="Current Rate"    value={92} suffix="%" valueStyle={{ color: "#52c41a" }} /></Card>
        <Card><Statistic title="Monthly Average" value={77} suffix="%" valueStyle={{ color: "#1677ff" }} /></Card>
        <Card><Statistic title="Yearly Average"  value={74} suffix="%" valueStyle={{ color: "#722ed1" }} /></Card>
      </div>
      <Card title="Occupancy Rate Trend">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(v) => `${v}%`} />
            <Line type="monotone" dataKey="rate" stroke="#1677ff" strokeWidth={2} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
