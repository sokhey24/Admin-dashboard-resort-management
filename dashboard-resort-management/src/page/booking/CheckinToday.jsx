import { useEffect, useState } from "react";
import { Table, Tag, Card, Button, Statistic, Row, Col, Spin, Modal, Form, Select, message } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { request } from "../../util/request";
import ActionButtons from "../../components/ActionButtons";

const { Option } = Select;

export default function CheckinToday() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const res = await request("admin/bookings?filter=checkin_today", "get");
    if (res?.data) setBookings(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCheckin = async (id) => {
    const res = await request(`admin/bookings/${id}`, "put", { status: "confirmed" });
    if (res?.message) { message.success("Checked in successfully"); load(); }
    else message.error("Failed to check in");
  };

  const handleDelete = async (id) => {
    const res = await request(`admin/bookings/${id}`, "delete");
    if (res?.message) { message.success("Booking deleted"); load(); }
    else message.error("Failed to delete");
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ status: record.status });
    setModal(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/bookings/${editing.id}`, "put", values);
    setSaving(false);
    if (res?.message) { message.success("Updated"); setModal(false); load(); }
    else message.error("Failed to update");
  };

  const columns = [
    { title: "Guest",     dataIndex: ["user", "name"],            render: (v) => v || "-" },
    { title: "Room",      dataIndex: ["rooms", 0, "room_number"], render: (v) => v || "-" },
    { title: "Check-in",  dataIndex: "check_in" },
    { title: "Check-out", dataIndex: "check_out" },
    { title: "Status",    dataIndex: "status", render: (s) => (
      <Tag color={s === "confirmed" ? "green" : "blue"}>
        {s?.charAt(0).toUpperCase() + s?.slice(1)}
      </Tag>
    )},
    { title: "Action", render: (_, record) => (
      <div className="flex gap-1.5 flex-wrap">
        <Button size="small" type="primary" icon={<CheckCircleOutlined />}
          disabled={record.status === "confirmed"}
          onClick={() => handleCheckin(record.id)}>
          Check In
        </Button>
        <ActionButtons
          onEdit={() => openEdit(record)}
          onDelete={() => handleDelete(record.id)}
          deleteMsg="Delete this booking?"
        />
      </div>
    )},
  ];

  const checkedIn = bookings.filter((b) => b.status === "confirmed").length;
  const arriving  = bookings.filter((b) => b.status === "pending").length;

  return (
    <Spin spinning={loading}>
      <h2 className="text-xl font-bold mb-5">Check-in Today</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><Statistic title="Total Check-ins Today" value={bookings.length} valueStyle={{ color: "#1677ff" }} /></Card>
        <Card><Statistic title="Checked In" value={checkedIn} valueStyle={{ color: "#52c41a" }} /></Card>
        <Card><Statistic title="Arriving"   value={arriving}  valueStyle={{ color: "#faad14" }} /></Card>
      </div>
      <Card title={`Check-ins — ${new Date().toDateString()}`}>
        <Table columns={columns} dataSource={bookings} rowKey="id" pagination={false} size="small" />
      </Card>

      <Modal title="Edit Booking" open={modal} onOk={handleSave} onCancel={() => setModal(false)} confirmLoading={saving} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
}
