import { Card, Tag, Button, Table } from "antd";
import { MdAdd } from "react-icons/md";

const tables = [
  { id: "T01", seats: 2, status: "Available" }, { id: "T02", seats: 4, status: "Reserved" },
  { id: "T03", seats: 6, status: "Occupied" },  { id: "T04", seats: 2, status: "Available" },
  { id: "T05", seats: 8, status: "Reserved" },  { id: "T06", seats: 4, status: "Available" },
];

const statusColor = { Available: "green", Reserved: "blue", Occupied: "red" };
const borderColor = { Available: "border-green-400", Reserved: "border-blue-400", Occupied: "border-red-400" };

const columns = [
  { title: "Guest",  dataIndex: "guest" },
  { title: "Table",  dataIndex: "table" },
  { title: "Date",   dataIndex: "date" },
  { title: "Time",   dataIndex: "time" },
  { title: "Guests", dataIndex: "guests" },
  { title: "Status", dataIndex: "status", render: (s) => <Tag color={statusColor[s] || "default"}>{s}</Tag> },
];

const reservations = [
  { key: 1, guest: "John Smith", table: "T02", date: "2025-07-14", time: "19:00", guests: 3, status: "Reserved" },
  { key: 2, guest: "Emma Lee",   table: "T05", date: "2025-07-14", time: "20:00", guests: 6, status: "Reserved" },
  { key: 3, guest: "Carlos M.",  table: "T03", date: "2025-07-14", time: "18:30", guests: 4, status: "Occupied" },
];

export default function TableReservation() {
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold m-0">Table Reservation</h2>
        <Button type="primary" icon={<MdAdd />}>New Reservation</Button>
      </div>
      <div className="grid grid-cols-6 gap-3 mb-6">
        {tables.map((t) => (
          <Card key={t.id} size="small" className={`text-center border-2 ${borderColor[t.status]}`}>
            <div className="font-bold text-base">{t.id}</div>
            <div className="text-xs text-gray-400">{t.seats} seats</div>
            <Tag color={statusColor[t.status]} className="mt-1">{t.status}</Tag>
          </Card>
        ))}
      </div>
      <Card title="Today's Reservations">
        <Table columns={columns} dataSource={reservations} pagination={false} size="small" />
      </Card>
    </div>
  );
}
