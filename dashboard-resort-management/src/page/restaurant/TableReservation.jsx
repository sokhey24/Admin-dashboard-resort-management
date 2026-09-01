import { useMemo, useState } from "react";
import { MdSearch, MdAdd } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";

const PAGE_SIZE = 8;

const TABLES_DATA = [
  { id: "T01", seats: 2, status: "Available" }, { id: "T02", seats: 4, status: "Reserved" },
  { id: "T03", seats: 6, status: "Occupied" },  { id: "T04", seats: 2, status: "Available" },
  { id: "T05", seats: 8, status: "Reserved" },  { id: "T06", seats: 4, status: "Available" },
];

const RESERVATIONS = [
  { key: 1, guest: "John Smith", table: "T02", date: "2025-07-14", time: "19:00", guests: 3, status: "Reserved" },
  { key: 2, guest: "Emma Lee",   table: "T05", date: "2025-07-14", time: "20:00", guests: 6, status: "Reserved" },
  { key: 3, guest: "Carlos M.",  table: "T03", date: "2025-07-14", time: "18:30", guests: 4, status: "Occupied" },
];

const TABLE_STATUS = {
  Available: { dot: "bg-green-500", light: "bg-green-50 text-green-700 ring-green-200",   dark: "bg-green-900/40 text-green-400 ring-green-700",  border: "border-green-400" },
  Reserved:  { dot: "bg-blue-500",  light: "bg-blue-50 text-blue-700 ring-blue-200",       dark: "bg-blue-900/40 text-blue-400 ring-blue-700",     border: "border-blue-400"  },
  Occupied:  { dot: "bg-red-500",   light: "bg-red-50 text-red-700 ring-red-200",           dark: "bg-red-900/40 text-red-400 ring-red-700",        border: "border-red-400"   },
};

function BadgeWithDot({ status, dark }) {
  const s = TABLE_STATUS[status] ?? TABLE_STATUS.Available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function TableReservation() {
  const dark = useDarkMode();
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return RESERVATIONS.filter(r =>
      !q ||
      r.guest.toLowerCase().includes(q) ||
      r.table.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.date.includes(q)
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr   = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText   = dark ? "text-gray-400"                 : "text-[#829AB1]";
  const thead     = dark ? "bg-gray-700/60"                : "bg-[#F5F8FC]";
  const thText    = dark ? "text-gray-400"                 : "text-[#829AB1]";
  const tbody     = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-gray-100";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-[#F5F8FC]";
  const cellText  = dark ? "text-gray-300"                 : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]"                 : "text-[#829AB1]";
  const divider   = dark ? "divide-gray-700"               : "divide-gray-200";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className="flex justify-between items-center mb-5">
        <h2 className={`text-[26px] font-bold ${titleCls}`}>Table Reservation</h2>
        <Button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00]">
          <MdAdd size={14} /> New Reservation
        </Button>
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {TABLES_DATA.map(t => {
          const s = TABLE_STATUS[t.status];
          return (
            <div key={t.id} className={`rounded-xl border-2 p-3 text-center ${card} ${s.border}`}>
              <div className={`font-bold text-base ${titleCls}`}>{t.id}</div>
              <div className={`text-xs mb-1 ${subText}`}>{t.seats} seats</div>
              <BadgeWithDot status={t.status} dark={dark} />
            </div>
          );
        })}
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Today's Reservations</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {filtered.length} records
            </span>
          </div>
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search guest, table…" className={searchCls} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Guest", "Table", "Date", "Time", "Guests", "Status"].map(h => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText} ${h === "No." ? "w-12 px-4" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {pageItems.length === 0 ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>No reservations found</td></tr>
              ) : pageItems.map((r, idx) => (
                <tr key={r.key} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{r.guest}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{r.table}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{r.date}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{r.time}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{r.guests}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={r.status} dark={dark} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages} · {filtered.length} records</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`}>{p}</Button>
            ))}
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
