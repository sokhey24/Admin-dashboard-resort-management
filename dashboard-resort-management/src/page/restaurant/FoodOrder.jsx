import { useEffect, useState } from "react";
import { Table, Tag, Card, Row, Col, Statistic, Spin, Modal, Form, Select, message } from "antd";
import { request } from "../../util/request";
import ActionButtons from "../../components/ActionButtons";

const { Option } = Select;

export default function FoodOrder() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    request("admin/bookings", "get").then((res) => {
      if (res?.data) setOrders(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ status: record.status });
    setModal(true);
  };

  const handleDelete = async (id) => {
    const res = await request(`admin/bookings/${id}`, "delete");
    if (res?.message) { message.success("Order deleted"); load(); }
    else message.error("Failed to delete");
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/bookings/${editing.id}`, "put", values);
    setSaving(false);
    if (res?.message) { message.success("Order updated"); setModal(false); load(); }
    else message.error("Failed to update");
  };

  const columns = [
    { title: "Order #",  dataIndex: "id" },
    { title: "Table",    dataIndex: ["table", "table_number"], render: (v) => v || "-" },
    { title: "Customer", dataIndex: ["user",  "name"],         render: (v) => v || "-" },
    { title: "Total",    dataIndex: "total_amount",            render: (v) => `$${v || 0}` },
    { title: "Status",   dataIndex: "status", render: (s) => (
      <Tag color={s === "completed" ? "green" : s === "pending" ? "orange" : s === "cancelled" ? "red" : "blue"}>
        {s?.charAt(0).toUpperCase() + s?.slice(1)}
      </Tag>
    )},
    { title: "Date",   dataIndex: "created_at", render: (v) => v?.slice(0, 10) },
    { title: "Action", render: (_, record) => (
      <ActionButtons
        onEdit={() => openEdit(record)}
        onDelete={() => handleDelete(record.id)}
        deleteMsg="Delete this order?"
      />
    )},
  ];

  const pending   = orders.filter((o) => o.status === "pending").length;
  const completed = orders.filter((o) => o.status === "completed").length;

  return (
    <Spin spinning={loading}>
      <h2 className="text-xl font-bold mb-5">Food Orders</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><Statistic title="Total Orders"     value={orders.length} valueStyle={{ color: "#1677ff" }} /></Card>
        <Card><Statistic title="Pending Orders"   value={pending}       valueStyle={{ color: "#faad14" }} /></Card>
        <Card><Statistic title="Completed Orders" value={completed}     valueStyle={{ color: "#52c41a" }} /></Card>
      </div>
      <Card title="All Orders">
        <Table columns={columns} dataSource={orders} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
      </Card>

      <Modal title="Edit Order" open={modal} onOk={handleSave} onCancel={() => setModal(false)} confirmLoading={saving} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="processing">Processing</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
}
