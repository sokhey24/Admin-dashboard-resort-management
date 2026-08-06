import { useEffect, useState } from "react";
import { Card, Statistic, Table, Spin } from "antd";
import { MdRestaurant, MdAccessTime, MdAttachMoney } from "react-icons/md";
import { request } from "../../util/request";

const topItemColumns = [
  { title: "#",         dataIndex: "order_items_count", width: 50 },
  { title: "Menu Item", dataIndex: "name" },
  { title: "Price",     dataIndex: "price", render: (v) => `$${v}` },
];

export default function RestaurantDashboard() {
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("restaurant/dashboard", "get").then((res) => {
      if (res) setData(res);
      setLoading(false);
    });
  }, []);

  const stats = [
    { title: "Orders Today",       value: data.orders_today       ?? 0, icon: <MdRestaurant />,  color: "#1677ff" },
    { title: "Pending Orders",     value: data.pending_orders     ?? 0, icon: <MdAccessTime />,  color: "#faad14" },
    { title: "Tables Available",   value: data.tables_available   ?? 0, icon: <MdRestaurant />,  color: "#52c41a" },
    { title: "Tables Occupied",    value: data.tables_occupied    ?? 0, icon: <MdRestaurant />,  color: "#ff4d4f" },
    { title: "Reservations Today", value: data.reservations_today ?? 0, icon: <MdAccessTime />,  color: "#722ed1" },
    { title: "Revenue Today",      value: data.revenue_today      ?? 0, icon: <MdAttachMoney />, color: "#52c41a", precision: 2 },
  ];

  return (
    <Spin spinning={loading}>
      <h2 className="text-xl font-bold mb-5">Restaurant Dashboard</h2>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {stats.map((s) => (
          <Card key={s.title}>
            <Statistic title={s.title} value={s.value} prefix={s.icon} valueStyle={{ color: s.color }} precision={s.precision} />
          </Card>
        ))}
      </div>
      {data.top_menu_items?.length > 0 && (
        <Card title="Top Menu Items">
          <Table columns={topItemColumns} dataSource={data.top_menu_items} rowKey="id" pagination={false} size="small" />
        </Card>
      )}
    </Spin>
  );
}
