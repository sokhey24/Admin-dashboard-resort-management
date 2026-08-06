import { Table, Card, Row, Col, Statistic, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const columns = [
  { title: "Month", dataIndex: "month" },
  { title: "Room Revenue", dataIndex: "room", render: (v) => `$${v.toLocaleString()}` },
  { title: "Restaurant", dataIndex: "restaurant", render: (v) => `$${v.toLocaleString()}` },
  { title: "Other", dataIndex: "other", render: (v) => `$${v.toLocaleString()}` },
  { title: "Total", dataIndex: "total", render: (v) => <strong>${v.toLocaleString()}</strong> },
  { title: "Growth", dataIndex: "growth", render: (v) => <span style={{ color: v >= 0 ? "#52c41a" : "#ff4d4f" }}>{v >= 0 ? "+" : ""}{v}%</span> },
];

const data = [
  { key: 1, month: "January", room: 12000, restaurant: 3200, other: 800, total: 16000, growth: 0 },
  { key: 2, month: "February", room: 15000, restaurant: 4100, other: 1000, total: 20100, growth: 25.6 },
  { key: 3, month: "March", room: 18000, restaurant: 5200, other: 1200, total: 24400, growth: 21.4 },
  { key: 4, month: "April", room: 14000, restaurant: 3800, other: 900, total: 18700, growth: -23.4 },
  { key: 5, month: "May", room: 22000, restaurant: 6100, other: 1500, total: 29600, growth: 58.3 },
  { key: 6, month: "June", room: 19000, restaurant: 5500, other: 1300, total: 25800, growth: -12.8 },
  { key: 7, month: "July", room: 25000, restaurant: 7200, other: 1800, total: 34000, growth: 31.8 },
];

const total = data.reduce((acc, r) => acc + r.total, 0);

export default function RevenueReport() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Revenue Report 2025</h2>
        <Button icon={<DownloadOutlined />}>Export Report</Button>
      </div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title="YTD Revenue" value={total} prefix="$" valueStyle={{ color: "#52c41a" }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Best Month" value="July" valueStyle={{ color: "#1677ff" }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Avg Monthly" value={Math.round(total / data.length)} prefix="$" valueStyle={{ color: "#722ed1" }} /></Card></Col>
      </Row>
      <Card title="Monthly Revenue Breakdown">
        <Table columns={columns} dataSource={data} pagination={false} size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell><strong>Total</strong></Table.Summary.Cell>
              <Table.Summary.Cell><strong>${data.reduce((a, r) => a + r.room, 0).toLocaleString()}</strong></Table.Summary.Cell>
              <Table.Summary.Cell><strong>${data.reduce((a, r) => a + r.restaurant, 0).toLocaleString()}</strong></Table.Summary.Cell>
              <Table.Summary.Cell><strong>${data.reduce((a, r) => a + r.other, 0).toLocaleString()}</strong></Table.Summary.Cell>
              <Table.Summary.Cell><strong>${total.toLocaleString()}</strong></Table.Summary.Cell>
              <Table.Summary.Cell />
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
}
