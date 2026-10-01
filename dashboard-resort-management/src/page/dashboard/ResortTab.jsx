function ResortTab({ dark }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("resort/dashboard", "get")
      .then(res => { if (res) setData(res); })
      .finally(() => setLoading(false));
  }, []);

  const d = data ?? {};

  return (
    <Spin spinning={loading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard title="Available Rooms" value={d.rooms_available   ?? 0} icon={<FaBed />}           color="#52c41a" dark={dark} loading={loading} />
        <StatCard title="Occupied Rooms"  value={d.rooms_occupied    ?? 0} icon={<FaHome />}          color="#1677ff" dark={dark} loading={loading} />
        <StatCard title="Maintenance"     value={d.rooms_maintenance ?? 0} icon={<FaClock />}         color="#faad14" dark={dark} loading={loading} />
        <StatCard title="Active Bookings" value={d.active_bookings   ?? 0} icon={<FaCalendarAlt />}   color="#722ed1" dark={dark} loading={loading} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Check-in Today"  value={d.checkin_today     ?? 0} icon={<FaCheckCircle />}   color="#13c2c2" dark={dark} loading={loading} />
        <StatCard title="Check-out Today" value={d.checkout_today    ?? 0} icon={<FaTimesCircle />}   color="#ff4d4f" dark={dark} loading={loading} />
        <StatCard title="Avg Rating"      value={d.average_rating ? Number(d.average_rating).toFixed(1) : "—"} icon={<FaChartBar />} color="#fa8c16" dark={dark} loading={loading} />
        <StatCard title="Coupons Used"    value={d.coupon_used       ?? 0} icon={<FaMoneyBillWave />} color="#52c41a" dark={dark} loading={loading} />
      </div>
      <div className="mb-4">
        <Chart_data_resort />
      </div>
    </Spin>
  );
}