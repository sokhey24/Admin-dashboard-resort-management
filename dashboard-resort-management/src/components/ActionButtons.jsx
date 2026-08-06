import { Button, Popconfirm, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function ActionButtons({ onEdit, onDelete, deleteMsg = "Are you sure you want to delete?" }) {
  return (
    <Space>
      <Button
        size="small"
        type="primary"
        icon={<EditOutlined />}
        onClick={onEdit}
      >
        Edit
      </Button>
      <Popconfirm
        title="Delete"
        description={deleteMsg}
        onConfirm={onDelete}
        okText="Yes"
        cancelText="No"
        okButtonProps={{ danger: true }}
      >
        <Button size="small" danger icon={<DeleteOutlined />}>
          Delete
        </Button>
      </Popconfirm>
    </Space>
  );
}
