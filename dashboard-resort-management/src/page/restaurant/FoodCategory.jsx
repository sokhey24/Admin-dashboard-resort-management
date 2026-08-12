import { Table, Card, Button, Tag } from "antd";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";

const columns = [
  { title: "#",        dataIndex: "key" },
  { title: "Category", dataIndex: "name" },
  { title: "Icon",     dataIndex: "icon" },
  { title: "Items",    dataIndex: "items" },
  { title: "Status",   dataIndex: "status", render: (s) => <Tag color={s === "Active" ? "green" : "red"}>{s}</Tag> },
  { title: "Action",   render: () => (
    <div className="flex gap-1">
      <Button size="small" icon={<MdEdit />}>Edit</Button>
      <Button size="small" danger icon={<MdDelete />}>Delete</Button>
    </div>
  )},
];


const data = [
  { key: 1, name: "Starter",     image: "https://i.pinimg.com/1200x/fe/65/fd/fe65fd37f7e8627b8d1f7951e7f3c8d1.jpg", items: 8,  status: "Active" },
  { key: 2, name: "Main Course", image: "https://i.pinimg.com/1200x/fe/65/fd/fe65fd37f7e8627b8d1f7951e7f3c8d1.jpg", items: 15, status: "Active" },
  { key: 3, name: "Dessert",     image: "https://i.pinimg.com/1200x/fe/65/fd/fe65fd37f7e8627b8d1f7951e7f3c8d1.jpg", items: 6,  status: "Active" },
  { key: 4, name: "Beverage",    image: "https://i.pinimg.com/1200x/fe/65/fd/fe65fd37f7e8627b8d1f7951e7f3c8d1.jpg", items: 12, status: "Active" },
  { key: 5, name: "Seafood",     image: "https://i.pinimg.com/1200x/fe/65/fd/fe65fd37f7e8627b8d1f7951e7f3c8d1.jpg", items: 9,  status: "Active" },
  { key: 6, name: "Vegetarian",  image: "https://i.pinimg.com/1200x/fe/65/fd/fe65fd37f7e8627b8d1f7951e7f3c8d1.jpg", items: 7,  status: "Inactive" },
];

export default function FoodCategory() {
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold m-0">Food Categories</h2>
        <Button type="primary" icon={<MdAdd />}>Add Category</Button>
      </div>
      <Card>
        <Table columns={columns} dataSource={data} pagination={false} size="small" />
      </Card>
    </div>
  );
}
