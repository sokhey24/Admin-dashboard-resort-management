import { Table, Card, Button, Tag, Input } from "antd";
import { MdAdd, MdSearch, MdEdit } from "react-icons/md";
import { useState } from "react";

const allData = [
  { key: 1, name: "Grilled Salmon",       category: "Main Course", price: 28, status: "Available" },
  { key: 2, name: "Caesar Salad",         category: "Starter",     price: 12, status: "Available" },
  { key: 3, name: "Beef Steak",           category: "Main Course", price: 45, status: "Available" },
  { key: 4, name: "Chocolate Lava Cake",  category: "Dessert",     price: 14, status: "Available" },
  { key: 5, name: "Tropical Smoothie",    category: "Beverage",    price: 8,  status: "Out of Stock" },
  { key: 6, name: "Lobster Bisque",       category: "Starter",     price: 18, status: "Available" },
];

const columns = [
  { title: "Item",     dataIndex: "name" },
  { title: "Category", dataIndex: "category", render: (c) => <Tag>{c}</Tag> },
  { title: "Price",    dataIndex: "price",    render: (v) => `$${v}` },
  { title: "Status",   dataIndex: "status",   render: (s) => <Tag color={s === "Available" ? "green" : "red"}>{s}</Tag> },
  { title: "Action",   render: () => <Button size="small" icon={<MdEdit />}>Edit</Button> },
];

export default function Menu() {
  const [search, setSearch] = useState("");
  const filtered = allData.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold m-0">Restaurant Menu</h2>
        <Button type="primary" icon={<MdAdd />}>Add Item</Button>
      </div>
      <Card>
        <Input prefix={<MdSearch />} placeholder="Search menu" value={search}
          onChange={(e) => setSearch(e.target.value)} className="w-64 mb-4" />
        <Table columns={columns} dataSource={filtered} size="small" />
      </Card>
    </div>
  );
}
