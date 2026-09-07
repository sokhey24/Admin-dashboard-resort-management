import React from 'react'
import { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { FaUsers, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { request, buildQS } from '../../utils/request';
import StatCard from '../../components/StatCard';
import DateFilter from '../../components/DateFilter';
import ChartDataDashboard from '../../components/ChartDataDashboard';
import AreaChartAnalaysisPerformance from '../../components/AreaChartAnalaysisPerformance';
function RevenueTab() {


  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ date: null, month: null, year: null });

  const load = (f = filter) => {
    setLoading(true);
    const qs = buildQS(f);
    request(`admin/dashboard${qs}`, "get")
      .then(res => { if (res?.success) setData(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (f) => { setFilter(f); load(f); };

  const axisColor = dark ? "#6b7280" : "#9ca3af";
  const gridColor = dark ? "#374151" : "#e5e7eb";
  const monthly   = data?.monthly_revenue ?? [];
  const totalRev  = monthly.reduce((s, r) => s + r.revenue, 0);
  const stats     = data?.statistics ?? {};
  return (
     <Spin spinning={loading}>
      <DateFilter filter={filter} onChange={handleFilter} dark={dark} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users"      value={stats.total_users}    icon={<FaUsers />}         color="#fa8c16" dark={dark} loading={loading} />
         <StatCard title="Today Check-ins"  value={stats.today_checkins} icon={<FaCalendarAlt />}   color="#1677ff" dark={dark} loading={loading} />
        <StatCard title="Today Check-outs" value={stats.today_checkouts}icon={<FaCalendarAlt />}   color="#722ed1" dark={dark} loading={loading} />
        <StatCard title="Total Revenue"    value={`$${Number(stats.total_revenue ?? 0).toLocaleString()}`} icon={<FaMoneyBillWave />} color="#52c41a" dark={dark} loading={loading} />
      </div>

     
    </Spin>
  )
}

export default RevenueTab

// function RevenueTab({ dark }) {
//   const [data,    setData]    = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [filter,  setFilter]  = useState({ date: null, month: null, year: null });

//   const load = (f = filter) => {
//     setLoading(true);
//     const qs = buildQS(f);
//     request(`admin/dashboard${qs}`, "get")
//       .then(res => { if (res?.success) setData(res.data); })
//       .finally(() => setLoading(false));
//   };

//   useEffect(() => { load(); }, []);

//   const handleFilter = (f) => { setFilter(f); load(f); };

//   const axisColor = dark ? "#6b7280" : "#9ca3af";
//   const gridColor = dark ? "#374151" : "#e5e7eb";
//   const monthly   = data?.monthly_revenue ?? [];
//   const totalRev  = monthly.reduce((s, r) => s + r.revenue, 0);
//   const stats     = data?.statistics ?? {};

//   return (
//     <Spin spinning={loading}>
//       <DateFilter filter={filter} onChange={handleFilter} dark={dark} />
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <StatCard title="Total Users"      value={stats.total_users}    icon={<FaUsers />}         color="#fa8c16" dark={dark} loading={loading} />
//         <StatCard title="Today Check-ins"  value={stats.today_checkins} icon={<FaCalendarAlt />}   color="#1677ff" dark={dark} loading={loading} />
//         <StatCard title="Today Check-outs" value={stats.today_checkouts}icon={<FaCalendarAlt />}   color="#722ed1" dark={dark} loading={loading} />
//         <StatCard title="Total Revenue"    value={`$${Number(stats.total_revenue ?? 0).toLocaleString()}`} icon={<FaMoneyBillWave />} color="#52c41a" dark={dark} loading={loading} />
//       </div>

//       <ChartDataDashboard/>
//       <AreaChartAnalaysisPerformance/>
//     </Spin>
//   );
// }