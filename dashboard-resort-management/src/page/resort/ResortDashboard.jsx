import { useEffect, useState } from "react";
import { Spin } from "antd";
import { MdHotel, MdCalendarMonth, MdStar, MdLocalOffer } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import Chart_data_resort from "../Chart_Data/Chart_data_resort";
import ChartCircle from "../Chart_Data/Chart_cirlce";
import CustomerManagement from "../customer/CustomerManagement";

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

export default function ResortDashboard() {
  const dark = useDarkMode();
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("resort/dashboard", "get").then((res) => {
      if (res) setData(res);
      setLoading(false);
    });
  }, []);

  const stats = [
    { title: "Available Rooms",  value: data.rooms_available   ?? 0, icon: <MdHotel />,        color: "#52c41a" },
    { title: "Occupied Rooms",   value: data.rooms_occupied    ?? 0, icon: <MdHotel />,        color: "#ff4d4f" },
    { title: "Maintenance",      value: data.rooms_maintenance ?? 0, icon: <MdHotel />,        color: "#faad14" },
    { title: "Active Bookings",  value: data.active_bookings   ?? 0, icon: <MdCalendarMonth />,color: "#1677ff" },
    { title: "Check-in Today",   value: data.checkin_today     ?? 0, icon: <MdCalendarMonth />,color: "#1677ff" },
    { title: "Check-out Today",  value: data.checkout_today    ?? 0, icon: <MdCalendarMonth />,color: "#722ed1" },
    { title: "Average Rating",   value: data.average_rating    ?? 0, icon: <MdStar />,         color: "#faad14" },
    { title: "Coupons Used",     value: data.coupon_used       ?? 0, icon: <MdLocalOffer />,   color: "#13c2c2" },
  ];

  return (
    <Spin spinning={loading}>
      <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
        <h2 className={`text-xl font-bold mb-5 ${dark ? "text-gray-100" : "text-gray-800"}`}>Resort Dashboard</h2>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {stats.map((s) => (
            <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} dark={dark} />
          ))}
        </div>

        {/* Charts */}
        <div className={`rounded-xl border p-5 mb-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Chart_data_resort />
            <ChartCircle />
          </div>
        </div>

        {/* Customer list */}
        <div className={`rounded-xl border p-5 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <CustomerManagement />
        </div>
      </div>
    </Spin>
  );
}
