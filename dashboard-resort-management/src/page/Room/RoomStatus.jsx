import { useEffect, useState } from "react";
import { Table, Tag, Card, Row, Col, Statistic, Spin, Modal, Form, Input, Select, message, InputNumber } from "antd";
import { request } from "../../util/request";
import ActionButtons from "../../components/ActionButtons";

const { Option } = Select;

export default function RoomStatus() {
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    request("admin/rooms", "get").then((res) => {
      if (res?.data) setRooms(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModal(true);
  };

  const handleDelete = async (id) => {
    const res = await request(`admin/rooms/${id}`, "delete");
    if (res?.message) { message.success("Room deleted"); load(); }
    else message.error("Failed to delete");
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/rooms/${editing.id}`, "put", values);
    setSaving(false);
    if (res?.message) { message.success("Room updated"); setModal(false); load(); }
    else message.error("Failed to update");
  };

  const available   = rooms.filter((r) => r.status === "available").length;
  const occupied    = rooms.filter((r) => r.status === "occupied").length;
  const maintenance = rooms.filter((r) => r.status === "maintenance").length;

  const columns = [
    { title: "Room",        dataIndex: "room_number" },
    { title: "Type",        dataIndex: ["room_type", "name"], render: (v) => v || "-" },
    { title: "Floor",       dataIndex: "floor" },
    { title: "Price/Night", dataIndex: "price_per_night", render: (v) => `$${v}` },
    { title: "Status",      dataIndex: "status", render: (s) => (
      <Tag color={s === "available" ? "green" : s === "occupied" ? "red" : "orange"}>
        {s?.charAt(0).toUpperCase() + s?.slice(1)}
      </Tag>
    )},
    { title: "Action", render: (_, record) => (
      <ActionButtons
        onEdit={() => openEdit(record)}
        onDelete={() => handleDelete(record.id)}
        deleteMsg="Delete this room?"
      />
    )},
  ];

  return (
    <Spin spinning={loading}>
      <h2 className="text-xl font-bold mb-5">Room Status</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><Statistic title="Available"   value={available}   valueStyle={{ color: "#52c41a" }} /></Card>
        <Card><Statistic title="Occupied"    value={occupied}    valueStyle={{ color: "#ff4d4f" }} /></Card>
        <Card><Statistic title="Maintenance" value={maintenance} valueStyle={{ color: "#faad14" }} /></Card>
      </div>
      <Card title="All Rooms">
        <Table columns={columns} dataSource={rooms} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
      </Card>

      <Modal title="Edit Room" open={modal} onOk={handleSave} onCancel={() => setModal(false)} confirmLoading={saving} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item name="room_number"    label="Room Number"  rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="floor"          label="Floor"><InputNumber className="w-full" /></Form.Item>
          <Form.Item name="price_per_night" label="Price/Night"><InputNumber className="w-full" prefix="$" /></Form.Item>
          <Form.Item name="status" label="Status">
            <Select>
              <Option value="available">Available</Option>
              <Option value="occupied">Occupied</Option>
              <Option value="maintenance">Maintenance</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
}
