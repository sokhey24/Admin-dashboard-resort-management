import { Button, Select } from "antd";
import { FaDollarSign, FaClock, FaMoneyBillWave } from "react-icons/fa";
import { MdSearch } from "react-icons/md";
import { DateFilter } from "../FilterData/Filter_data";
import { PAY_STATUSES, PAY_METHODS, fmtAmt } from "./paymentHelpers";

function StatCard({ title, value, icon, color, dark, loading }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{title}</span>
        <span className="text-lg" style={{ color }}>{icon}</span>
      </div>
      {loading
        ? <div className={`h-8 w-20 rounded animate-pulse ${dark ? "bg-gray-700" : "bg-[#F5F8FC]"}`} />
        : <div className="text-xl font-bold" style={{ color }}>{value}</div>}
    </div>
  );
}

/**
 * Summary stats, date filter, and table toolbar for payment records.
 */
export default function PaymentFiltersBar({
  children,
  dark,
  loading,
  stats,
  filter,
  onFilterChange,
  tableTitle,
  metaTotal,
  resorts,
  resortId,
  onResortChange,
  methodFilter,
  onMethodChange,
  statusFilter,
  onStatusChange,
  searchInput,
  onSearchInputChange,
  searchPlaceholder,
}) {
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const cardHdr = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const filterBg = dark ? "bg-gray-700" : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-gray-400 hover:text-gray-200" : "text-[#486581] hover:text-[#102A43]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-52"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-52 placeholder:text-[#829AB1]";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Collected" value={fmtAmt(stats.collected)} icon={<FaDollarSign />} color="#52c41a" dark={dark} loading={loading} />
        <StatCard title="Pending Amount" value={fmtAmt(stats.pending)} icon={<FaClock />} color="#faad14" dark={dark} loading={loading} />
        <StatCard title="Total Refunded" value={fmtAmt(stats.refunded)} icon={<FaMoneyBillWave />} color="#ff4d4f" dark={dark} loading={loading} />
      </div>
      <DateFilter filter={filter} onChange={onFilterChange} dark={dark} />
      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>{tableTitle}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
              dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"
            }`}>{metaTotal} records</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              allowClear
              placeholder="Resort"
              value={resortId}
              onChange={onResortChange}
              className="min-w-[160px]"
              options={resorts.map((r) => ({ value: r.id, label: r.name }))}
            />
            <Select
              placeholder="Method"
              value={methodFilter || ""}
              onChange={onMethodChange}
              className="min-w-[150px]"
              options={PAY_METHODS}
            />
            <div className={`flex gap-1 rounded-lg p-1 overflow-x-auto ${filterBg}`}>
              {PAY_STATUSES.map((s) => (
                <Button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === s ? filterAct : filterBtn
                  }`}
                >
                  {s === "all" ? "All" : s.replace(/\b\w/g, (c) => c.toUpperCase())}
                </Button>
              ))}
            </div>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={searchCls}
              />
            </div>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
