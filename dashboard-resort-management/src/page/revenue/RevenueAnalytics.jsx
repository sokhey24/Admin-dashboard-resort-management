import { useState } from "react";
import { Card, Row, Col, Statistic, Table, Button, DatePicker, Radio } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const RAW = {
  "2025-07-14": { room: 1800, restaurant: 500,  other: 120 },
  "2025-07-15": { room: 2100, restaurant: 620,  other: 150 },
  "2025-07-16": { room: 1600, restaurant: 410,  other: 90  },
  "2025-07-17": { room: 2400, restaurant: 700,  other: 180 },
  "2025-07-18": { room: 3100, restaurant: 900,  other: 220 },
  "2025-07-19": { room: 3800, restaurant: 1100, other: 280 },
  "2025-07-20": { room: 2900, restaurant: 850,  other: 200 },
  "2025-06-14": { room: 1500, restaurant: 400,  other: 100 },
  "2025-06-15": { room: 1700, restaurant: 450,  other: 110 },
  "2025-05-10": { room: 2200, restaurant: 600,  other: 160 },
  "2025-04-08": { room: 1400, restaurant: 380,  other: 90  },
  "2025-03-12": { room: 1800, restaurant: 520,  other: 120 },
  "2025-02-20": { room: 1500, restaurant: 410,  other: 100 },
  "2025-01-05": { room: 1200, restaurant: 320,  other: 80  },
  "2024-12-25": { room: 3200, restaurant: 950,  other: 300 },
  "2024-11-11": { room: 2100, restaurant: 600,  other: 170 },
  "2024-10-05": { room: 1900, restaurant: 540,  other: 140 },
  "2024-07-04": { room: 2800, restaurant: 800,  other: 220 },
  "2023-12-31": { room: 3500, restaurant: 1000, other: 320 },
  "2022-06-15": { room: 1600, restaurant: 450,  other: 110 },
};

function getFilteredData(period, dateVal) {
  const entries = dateVal
    ? Object.entries(RAW).filter(([k]) =>
        k.startsWith(dateVal.format(
          period === "day" ? "YYYY-MM-DD" : period === "monthly" ? "YYYY-MM" : "YYYY"
        ))
      )
    : Object.entries(RAW);

  if (entries.length === 0) return [];

  if (period === "day" && dateVal) {
    const d = entries[0][1];
    return [{ key: 1, month: dateVal.format("YYYY-MM-DD"), room: d.room, restaurant: d.restaurant, other: d.other, total: d.room + d.restaurant + d.other }];
  }

  const grouped = {};
  entries.forEach(([k, d]) => {
    const label = period === "monthly" ? k.slice(8)
                : period === "year"    ? k.slice(0, 7)
                :                       k.slice(0, 7);
    if (!grouped[label]) grouped[label] = { room: 0, restaurant: 0, other: 0 };
    grouped[label].room       += d.room;
    grouped[label].restaurant += d.restaurant;
    grouped[label].other      += d.other;
  });
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([label, d], i) => ({
    key: i + 1, month: label,
    room: d.room, restaurant: d.restaurant, other: d.other,
    total: d.room + d.restaurant + d.other,
  }));
}

export default function RevenueAnalytics() {
  const [period,  setPeriod]  = useState("monthly");
  const [dateVal, setDateVal] = useState(dayjs());

  const data       = getFilteredData(period, dateVal);
  const totalRev   = data.reduce((a, r) => a + r.total, 0);
  const totalRoom  = data.reduce((a, r) => a + r.room, 0);
  const avgRev     = data.length ? Math.round(totalRev / data.length) : 0;
  const bestRow    = data.length ? data.reduce((a, r) => (r.total > a.total ? r : a)).month : "-";

  const pickerType = period === "day" ? "date" : period === "monthly" ? "month" : "year";
  const titleLabel = period === "day" ? "Day" : period === "monthly" ? "Month" : "Year";

  const tableColumns = [
    { title: titleLabel,     dataIndex: "month" },
    { title: "Room Revenue", dataIndex: "room",       render: (v) => `$${v.toLocaleString()}` },
    { title: "Restaurant",   dataIndex: "restaurant", render: (v) => `$${v.toLocaleString()}` },
    { title: "Other",        dataIndex: "other",      render: (v) => `$${v.toLocaleString()}` },
    { title: "Total",        dataIndex: "total",      render: (v) => <strong>${v.toLocaleString()}</strong> },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Revenue Analytics</h2>
          <Radio.Group
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setDateVal(null); }}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: "Day",     value: "day" },
              { label: "Monthly", value: "monthly" },
              { label: "Year",    value: "year" },
            ]}
          />
          <DatePicker
            picker={pickerType}
            value={dateVal}
            onChange={(d) => setDateVal(d)}
            allowClear={false}
            placeholder="00-00-00"
            style={{ width: 150 }}
          />
          <Button onClick={() => setDateVal(null)}>Reset</Button>
        </div>
        <Button icon={<DownloadOutlined />}>Export Report</Button>
      </div>

      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="Total Revenue"       value={totalRev}  prefix="$" valueStyle={{ color: "#52c41a" }} /></Card></Col>
        <Col span={6}><Card><Statistic title={`Best ${titleLabel}`} value={bestRow}              valueStyle={{ color: "#1677ff" }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Avg Revenue"         value={avgRev}    prefix="$" valueStyle={{ color: "#722ed1" }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Room Revenue"        value={totalRoom} prefix="$" valueStyle={{ color: "#fa8c16" }} /></Card></Col>
      </Row>

      {/* Bar Chart */}
      <Card title="Revenue by Category" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="room"       name="Room"       fill="#1677ff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="restaurant" name="Restaurant" fill="#722ed1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="other"      name="Other"      fill="#fa8c16" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Line Chart */}
      <Card title="Total Revenue Trend" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            <Line type="monotone" dataKey="total" name="Total" stroke="#52c41a" strokeWidth={2} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Breakdown Table */}
      <Card title={`${titleLabel} Revenue Breakdown`}>
        <Table
          columns={tableColumns}
          dataSource={data}
          pagination={{ pageSize: 10, size: "small" }}
          size="small"
          locale={{ emptyText: "No data for selected date" }}
          summary={() => data.length > 0 && (
            <Table.Summary.Row>
              <Table.Summary.Cell><strong>Total</strong></Table.Summary.Cell>
              <Table.Summary.Cell><strong>${totalRoom.toLocaleString()}</strong></Table.Summary.Cell>
              <Table.Summary.Cell><strong>${data.reduce((a, r) => a + r.restaurant, 0).toLocaleString()}</strong></Table.Summary.Cell>
              <Table.Summary.Cell><strong>${data.reduce((a, r) => a + r.other, 0).toLocaleString()}</strong></Table.Summary.Cell>
              <Table.Summary.Cell><strong>${totalRev.toLocaleString()}</strong></Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
}
