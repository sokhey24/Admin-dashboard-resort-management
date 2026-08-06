import { Card, Row, Col, Statistic, Select } from "antd";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data2025 = [
  { month: "Jan", room: 12000, restaurant: 3200, total: 15200 },
  { month: "Feb", room: 15000, restaurant: 4100, total: 19100 },
  { month: "Mar", room: 18000, restaurant: 5200, total: 23200 },
  { month: "Apr", room: 14000, restaurant: 3800, total: 17800 },
  { month: "May", room: 22000, restaurant: 6100, total: 28100 },
  { month: "Jun", room: 19000, restaurant: 5500, total: 24500 },
  { month: "Jul", room: 25000, restaurant: 7200, total: 32200 },
];

export default function MonthlyChart() {
  const [year, setYear] = useState("2025");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Monthly Revenue Chart</h2>
        <Select value={year} onChange={setYear} options={[{ value: "2025", label: "2025" }, { value: "2024", label: "2024" }]} />
      </div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title="Total Revenue" value={160100} prefix="$" valueStyle={{ color: "#52c41a" }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Room Revenue" value={125000} prefix="$" valueStyle={{ color: "#1677ff" }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Restaurant Revenue" value={35100} prefix="$" valueStyle={{ color: "#722ed1" }} /></Card></Col>
      </Row>
      <Card title="Revenue by Category" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data2025}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="room" name="Room" fill="#1677ff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="restaurant" name="Restaurant" fill="#722ed1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Total Revenue Trend">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data2025}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            <Line type="monotone" dataKey="total" name="Total" stroke="#52c41a" strokeWidth={2} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
