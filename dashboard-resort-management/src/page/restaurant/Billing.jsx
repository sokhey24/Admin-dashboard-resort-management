import { Table, Card, Tag, Button, Statistic } from "antd";
import { MdPrint } from "react-icons/md";
import { MdAttachMoney } from "react-icons/md";

const columns = [
  { title: "Bill #",    dataIndex: "id" },
  { title: "Table",     dataIndex: "table" },
  { title: "Guest",     dataIndex: "guest" },
  { title: "Items",     dataIndex: "items" },
  { title: "Subtotal",  dataIndex: "subtotal",  render: (v) => `$${v}` },
  { title: "Tax (10%)", dataIndex: "tax",        render: (v) => `$${v}` },
  { title: "Total",     dataIndex: "total",      render: (v) => <strong>${v}</strong> },
  { title: "Status",    dataIndex: "status",     render: (s) => <Tag color={s === "Paid" ? "green" : "orange"}>{s}</Tag> },
  { title: "Action",    render: () => <Button size="small" icon={<MdPrint />}>Print</Button> },
];

const data = [
  { key: 1, id: "#B001", table: "T03", guest: "Carlos M.",  items: 2, subtotal: 40,  tax: 4,   total: 44,    status: "Paid" },
  { key: 2, id: "#B002", table: "T02", guest: "John Smith", items: 3, subtotal: 98,  tax: 9.8, total: 107.8, status: "Unpaid" },
  { key: 3, id: "#B003", table: "T05", guest: "Emma Lee",   items: 4, subtotal: 68,  tax: 6.8, total: 74.8,  status: "Paid" },
];

export default function Billing() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Restaurant Billing</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><Statistic title="Total Billed Today" value={226.6} prefix={<MdAttachMoney />} valueStyle={{ color: "#52c41a" }} /></Card>
        <Card><Statistic title="Paid"               value={118.8} prefix={<MdAttachMoney />} valueStyle={{ color: "#52c41a" }} /></Card>
        <Card><Statistic title="Unpaid"             value={107.8} prefix={<MdAttachMoney />} valueStyle={{ color: "#faad14" }} /></Card>
      </div>
      <Card title="Bills">
        <Table columns={columns} dataSource={data} pagination={false} size="small" />
      </Card>
    </div>
  );
}
