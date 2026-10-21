import {
  FaCalendarAlt, FaClock, FaUsers, FaBed, FaHome, FaConciergeBell,
} from "react-icons/fa";
import { MdOutlineBeachAccess } from "react-icons/md";
import RevenueStatCard from "./RevenueStatCard";
import DashboardStatCard from "./DashboardStatCard";

/**
 * Overview tab KPI grids (resort + revenue metrics).
 */
export default function StatCardsGroup({
  stats = {},
  dark,
  loading,
  currentRevenue = 0,
  comparison,
  comparisonLoading,
  comparisonError,
  periodLabel,
  canCompare,
}) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
        <DashboardStatCard title="Total Resorts" value={stats.total_resorts} icon={<MdOutlineBeachAccess />} color="#722ed1" dark={dark} loading={loading} />
        <DashboardStatCard title="Total Branches" value={stats.total_branches} icon={<FaHome />} color="#13c2c2" dark={dark} loading={loading} />
        <DashboardStatCard title="Total Rooms" value={stats.total_rooms} icon={<FaBed />} color="#fa8c16" dark={dark} loading={loading} />
        <DashboardStatCard title="Total Bookings" value={stats.total_bookings} icon={<FaCalendarAlt />} color="#1677ff" dark={dark} loading={loading} />
        <DashboardStatCard title="Guests" value={stats.total_guests ?? stats.total_users} icon={<FaUsers />} color="#52c41a" dark={dark} loading={loading} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <RevenueStatCard
          revenue={currentRevenue}
          dark={dark}
          loading={loading}
          comparison={comparison}
          comparisonLoading={comparisonLoading}
          comparisonError={comparisonError}
          periodLabel={periodLabel}
          canCompare={canCompare}
        />
        <DashboardStatCard title="Food Orders" value={stats.restaurant_orders} icon={<FaConciergeBell />} color="#fa8c16" dark={dark} loading={loading} />
        <DashboardStatCard title="Occupancy" value={`${Number(stats.occupancy_rate ?? 0)}%`} icon={<FaBed />} color="#1677ff" dark={dark} loading={loading} />
        <DashboardStatCard title="Current Stays" value={stats.current_stays ?? 0} icon={<FaCalendarAlt />} color="#13c2c2" dark={dark} loading={loading} />
        <DashboardStatCard title="Pending Payments" value={`$${Number(stats.pending_payments ?? 0).toLocaleString()}`} icon={<FaClock />} color="#faad14" dark={dark} loading={loading} />
      </div>
    </>
  );
}

export { DashboardStatCard };
