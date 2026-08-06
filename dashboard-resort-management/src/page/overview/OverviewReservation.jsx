import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Table, Tag, Spin, Modal, Form, Select, message } from "antd";
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { request } from "../../util/request";
import ActionButtons from "../../components/ActionButtons";

const { Option } = Select;

export default function OverviewReservation() {
  const [stats,    setStats]    = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const res = await request("admin/bookings", "get");
    if (res?.data) {
      setBookings(res.data);
      setStats({
        total:     res.data.length,
        confirmed: res.data.filter((b) => b.status === "confirmed").length,
        pending:   res.data.filter((b) => b.status === "pending").length,
        cancelled: res.data.filter((b) => b.status === "cancelled").length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ status: record.status });
    setModal(true);
  };

  const handleDelete = async (id) => {
    const res = await request(`admin/bookings/${id}`, "delete");
    if (res?.message) { message.success("Booking deleted"); load(); }
    else message.error("Failed to delete");
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/bookings/${editing.id}`, "put", values);
    setSaving(false);
    if (res?.message) { message.success("Booking updated"); setModal(false); load(); }
    else message.error("Failed to update");
  };

  const columns = [
    { title: "Guest",     dataIndex: ["user", "name"],             render: (v) => v || "-" },
    { title: "Room",      dataIndex: ["rooms", 0, "room_number"],  render: (v) => v || "-" },
    { title: "Check-in",  dataIndex: "check_in" },
    { title: "Check-out", dataIndex: "check_out" },
    { title: "Status",    dataIndex: "status", render: (s) => (
      <Tag color={s === "confirmed" ? "green" : s === "pending" ? "orange" : "red"}>
        {s?.charAt(0).toUpperCase() + s?.slice(1)}
      </Tag>
    )},
    { title: "Action", render: (_, record) => (
      <ActionButtons
        onEdit={() => openEdit(record)}
        onDelete={() => handleDelete(record.id)}
        deleteMsg="Delete this booking?"
      />
    )},
  ];

  return (
    <Spin spinning={loading}>
      <h2 style={{ marginBottom: 20 }}>Reservation Overview</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: "Total Reservations", value: stats.total,     icon: <CalendarOutlined />,    color: "#1677ff" },
          { title: "Confirmed",          value: stats.confirmed, icon: <CheckCircleOutlined />, color: "#52c41a" },
          { title: "Pending",            value: stats.pending,   icon: <ClockCircleOutlined />, color: "#faad14" },
          { title: "Cancelled",          value: stats.cancelled, icon: <CloseCircleOutlined />, color: "#ff4d4f" },
        ].map((s) => (
          <Col span={6} key={s.title}>
            <Card><Statistic title={s.title} value={s.value} prefix={s.icon} valueStyle={{ color: s.color }} /></Card>
          </Col>
        ))}
      </Row>
      <Card title="Recent Reservations">
        <Table columns={columns} dataSource={bookings.slice(0, 10)} rowKey="id" pagination={false} size="small" />
      </Card>

      <Modal title="Edit Booking" open={modal} onOk={handleSave} onCancel={() => setModal(false)} confirmLoading={saving} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
}
