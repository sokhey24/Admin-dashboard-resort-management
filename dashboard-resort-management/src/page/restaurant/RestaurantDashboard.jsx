import { useEffect, useState } from "react";
import { Spin } from "antd";
import { MdRestaurantMenu, MdAttachMoney, MdTableRestaurant, MdStar } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import Chart_data_resort from "../Chart_Data/Chart_data_resort";
import ChartCircle from "../Chart_Data/Chart_cirlce";

function StatCard({ title, value, icon, color, dark }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-gray-400" : "text-gray-500"}`}>{title}</span>
        <span className="text-xl" style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

export default function RestaurantDashboard() {
  const dark = useDarkMode();
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("restaurant/dashboard", "get").then((res) => {
      if (res) setData(res);
      setLoading(false);
    });
  }, []);

  const stats = [
    { title: "Total Menu Items",   value: data.total_menu      ?? 0, icon: <MdRestaurantMenu />, color: "#1677ff" },
    { title: "Orders Today",       value: data.orders_today    ?? 0, icon: <MdRestaurantMenu />, color: "#52c41a" },
    { title: "Tables Reserved",    value: data.tables_reserved ?? 0, icon: <MdTableRestaurant />, color: "#faad14" },
    { title: "Revenue Today",      value: `$${data.revenue_today ?? 0}`, icon: <MdAttachMoney />, color: "#722ed1" },
    { title: "Pending Orders",     value: data.pending_orders  ?? 0, icon: <MdRestaurantMenu />, color: "#ff4d4f" },
    { title: "Completed Orders",   value: data.completed_orders ?? 0, icon: <MdRestaurantMenu />, color: "#13c2c2" },
    { title: "Average Rating",     value: data.average_rating  ?? 0, icon: <MdStar />,           color: "#faad14" },
    { title: "Total Revenue",      value: `$${data.total_revenue ?? 0}`, icon: <MdAttachMoney />, color: "#52c41a" },
  ];

  return (
    <Spin spinning={loading}>
      <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
        <h2 className={`text-xl font-bold mb-5 ${dark ? "text-gray-100" : "text-gray-800"}`}>Restaurant Dashboard</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {stats.map((s) => (
            <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} dark={dark} />
          ))}
        </div>

        <div className={`rounded-xl border p-5 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Chart_data_resort />
            <ChartCircle />
          </div>
        </div>
      </div>
    </Spin>
  );
}
