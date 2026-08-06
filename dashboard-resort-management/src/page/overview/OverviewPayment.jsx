import { Row, Col, Card, Statistic, Table, Tag } from "antd";
import { DollarOutlined } from "@ant-design/icons";

const columns = [
  { title: "Guest", dataIndex: "guest" },
  { title: "Amount", dataIndex: "amount", render: (v) => `$${v.toLocaleString()}` },
  { title: "Method", dataIndex: "method" },
  { title: "Date", dataIndex: "date" },
  { title: "Status", dataIndex: "status", render: (s) => (
    <Tag color={s === "Paid" ? "green" : s === "Pending" ? "orange" : "red"}>{s}</Tag>
  )},
];

const data = [
  { key: 1, guest: "John Smith", amount: 1200, method: "Credit Card", date: "2025-07-10", status: "Paid" },
  { key: 2, guest: "Emma Lee", amount: 850, method: "Cash", date: "2025-07-11", status: "Paid" },
  { key: 3, guest: "Carlos M.", amount: 1500, method: "Bank Transfer", date: "2025-07-12", status: "Pending" },
  { key: 4, guest: "Aisha K.", amount: 600, method: "Credit Card", date: "2025-07-09", status: "Refunded" },
];

export default function OverviewPayment() {
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Payment Overview</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title="Total Collected" value={4150} prefix={<DollarOutlined />} valueStyle={{ color: "#52c41a" }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Pending" value={1500} prefix={<DollarOutlined />} valueStyle={{ color: "#faad14" }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Refunded" value={600} prefix={<DollarOutlined />} valueStyle={{ color: "#ff4d4f" }} /></Card></Col>
      </Row>
      <Card title="Payment Records">
        <Table columns={columns} dataSource={data} pagination={false} size="small" />
      </Card>
    </div>
  );
}
