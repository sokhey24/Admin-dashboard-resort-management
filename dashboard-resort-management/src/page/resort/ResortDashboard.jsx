import { useEffect, useState } from "react";
import { Spin } from "antd";
import { MdHotel, MdCalendarMonth, MdStar, MdLocalOffer } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import Chart_data_resort from "../Chart_Data/Chart_data_resort";
import CustomerReviewRoom from "../Room/CustomerReviewRoom";
import { buildQS, DateFilter } from "../FilterData/Filter_data";

function StatCard({ title, value, icon, color, dark }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{title}</span>
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
  const [filter,  setFilter]  = useState({ date: null, month: null, year: null });

  const [error, setError] = useState("");

  const load = (f = filter) => {
    setLoading(true);
    setError("");
    request(`resort/dashboard${buildQS(f)}`, "get").then((res) => {
      if (res?.errors) {
        setData({});
        setError(res.errors.message ?? "Unable to load resort dashboard.");
      } else if (res) {
        setData(res);
      }
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleFilter = (f) => { setFilter(f); load(f); };

  const stats = [
    { title: "Available Rooms",  value: data.rooms_available   ?? 0, icon: <MdHotel />,        color: "#52c41a" },
    { title: "Occupied Rooms",   value: data.rooms_occupied    ?? 0, icon: <MdHotel />,        color: "#ff4d4f" },
    { title: "Occupancy",        value: `${Number(data.occupancy_rate ?? 0)}%`, icon: <MdHotel />, color: "#1677ff" },
    { title: "Maintenance",      value: data.rooms_maintenance ?? 0, icon: <MdHotel />,        color: "#faad14" },
    { title: "Pending Bookings", value: data.pending_bookings  ?? 0, icon: <MdCalendarMonth />,color: "#faad14" },
    { title: "Current Stays",    value: data.current_stays     ?? 0, icon: <MdHotel />,        color: "#13c2c2" },
    { title: "Active Bookings",  value: data.active_bookings   ?? 0, icon: <MdCalendarMonth />,color: "#1677ff" },
    { title: "Check-in Today",   value: data.checkin_today     ?? 0, icon: <MdCalendarMonth />,color: "#1677ff" },
    { title: "Check-out Today",  value: data.checkout_today    ?? 0, icon: <MdCalendarMonth />,color: "#722ed1" },
    { title: "Today's Revenue",  value: `$${Number(data.revenue_today ?? 0).toLocaleString()}`, icon: <MdLocalOffer />, color: "#52c41a" },
    { title: "Room Revenue",     value: `$${Number(data.revenue_total ?? 0).toLocaleString()}`, icon: <MdLocalOffer />, color: "#1677ff" },
    { title: "Outstanding",      value: `$${Number(data.outstanding_balance ?? 0).toLocaleString()}`, icon: <MdLocalOffer />, color: "#faad14" },
    { title: "Average Rating",   value: data.average_rating ? Number(data.average_rating).toFixed(1) : "—", icon: <MdStar />, color: "#faad14" },
    { title: "Coupons Used",     value: data.coupon_used       ?? 0, icon: <MdLocalOffer />,   color: "#13c2c2" },
  ];

  return (
    <Spin spinning={loading}>
      <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
        <h2 className={`text-[26px] font-bold mb-5 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Resort Dashboard</h2>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {stats.map((s) => (
            <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} dark={dark} />
          ))}
        </div>

        {/* Date filter */}
        <DateFilter filter={filter} onChange={handleFilter} dark={dark} />

        {/* Charts */}
        <div className={`rounded-xl border p-5 mb-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
          <div className="mb-4">
            <Chart_data_resort className="min-w-full"/>
          </div>
        </div>

        {/* Customer list */}
        <div className={`rounded-xl border p-5 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
          <CustomerReviewRoom embedded />
        </div>
      </div>
    </Spin>
  );
}
