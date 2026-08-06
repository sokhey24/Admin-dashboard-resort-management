import { useEffect, useState } from "react";
import { Table, Tag, Card, Button, Space, Statistic, Row, Col, Spin, Modal, Form, Select, message } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { request } from "../../util/request";
import ActionButtons from "../../components/ActionButtons";

const { Option } = Select;

export default function PendingBooking() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const res = await request("admin/bookings?status=pending", "get");
    if (res?.data) setBookings(res.data.filter((b) => b.status === "pending"));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    const res = await request(`admin/bookings/${id}`, "put", { status });
    if (res?.message) { message.success(`Booking ${status}`); load(); }
    else message.error("Failed to update");
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
      <Tag color="orange">{s?.charAt(0).toUpperCase() + s?.slice(1)}</Tag>
    )},
    { title: "Action", render: (_, record) => (
      <div className="flex gap-1.5 flex-wrap">
        <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => updateStatus(record.id, "confirmed")}>Approve</Button>
        <Button size="small" danger        icon={<CloseOutlined />}  onClick={() => updateStatus(record.id, "cancelled")}>Reject</Button>
        <ActionButtons
          onEdit={() => openEdit(record)}
          onDelete={() => handleDelete(record.id)}
          deleteMsg="Delete this booking?"
        />
      </div>
    )},
  ];

  return (
    <Spin spinning={loading}>
      <h2 className="text-xl font-bold mb-5">Pending Bookings</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card><Statistic title="Pending Approvals" value={bookings.length} valueStyle={{ color: "#faad14" }} /></Card>
        <Card><Statistic title="Awaiting Payment"  value={0}               valueStyle={{ color: "#ff4d4f" }} /></Card>
      </div>
      <Card title="Pending Bookings">
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
