import { Card, Statistic, Table, Avatar } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";

const columns = [
  { title: "Name",   dataIndex: "name",   render: (n) => <><Avatar icon={<UserOutlined />} className="mr-2" />{n}</> },
  { title: "Email",  dataIndex: "email" },
  { title: "Phone",  dataIndex: "phone" },
  { title: "Visits", dataIndex: "visits" },
];

const data = [
  { key: 1, name: "John Smith", email: "john@email.com",   phone: "+1 555-0101", visits: 5 },
  { key: 2, name: "Emma Lee",   email: "emma@email.com",   phone: "+1 555-0102", visits: 3 },
  { key: 3, name: "Carlos M.",  email: "carlos@email.com", phone: "+1 555-0103", visits: 7 },
  { key: 4, name: "Aisha K.",   email: "aisha@email.com",  phone: "+1 555-0104", visits: 2 },
];

export default function OverviewGuest() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Guest Overview</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><Statistic title="Total Guests"     value={342} prefix={<TeamOutlined />} valueStyle={{ color: "#1677ff" }} /></Card>
        <Card><Statistic title="New This Month"   value={28}  prefix={<UserOutlined />} valueStyle={{ color: "#52c41a" }} /></Card>
        <Card><Statistic title="Returning Guests" value={314} prefix={<UserOutlined />} valueStyle={{ color: "#722ed1" }} /></Card>
      </div>
      <Card title="Guest List">
        <Table columns={columns} dataSource={data} pagination={false} size="small" />
      </Card>
    </div>
  );
}
