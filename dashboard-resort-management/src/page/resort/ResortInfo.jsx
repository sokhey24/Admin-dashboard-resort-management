import { useEffect, useMemo, useState } from "react";
import { MdSearch, MdOutlineBeachAccess } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";

const PAGE_SIZE = 8;

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

function BadgeStatus({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function ResortInfo() {
  const dark = useDarkMode();
  const [resorts,  setResorts]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    request("admin/resorts", "get").then((res) => {
      if (res?.data) setResorts(res.data);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resorts.filter(r =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (!q || r.name?.toLowerCase().includes(q) ||
             r.email?.toLowerCase().includes(q) ||
             r.phone?.toLowerCase().includes(q) ||
             r.address?.toLowerCase().includes(q))
    );
  }, [resorts, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // style tokens — mirrors User Management
  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr   = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText   = dark ? "text-gray-400"                 : "text-[#486581]";
  const thead     = dark ? "bg-gray-700/60"                : "bg-[#F5F8FC]";
  const thText    = dark ? "text-gray-400"                 : "text-[#486581]";
  const tbody     = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-[#D9E2EC]";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-[#F5F8FC]";
  const cellText  = dark ? "text-gray-300"                 : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]"                 : "text-[#829AB1]";
  const divider   = dark ? "divide-gray-700"               : "divide-[#D9E2EC]";
  const filterBg  = dark ? "bg-gray-700"                   : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-gray-400 hover:text-gray-200" : "text-[#486581] hover:text-[#102A43]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48 placeholder:text-[#829AB1]";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold text-[#486581] hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Resort Information</h2>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-bold ${titleCls}`}>Resorts</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FFF3E8] text-[#FF6B00] ring-[#FFD4A8]"}`}>
              {filtered.length} resorts
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <div className={`flex gap-1 rounded-lg p-1 ${filterBg}`}>
              {["all", "active", "inactive"].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === s ? filterAct : filterBtn}`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…" className={searchCls} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No.</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Resort</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Phone</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Address</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Branches</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Status</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={6} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={6} className={`py-16 text-center text-sm ${subText}`}>No resorts found</td></tr>
              ) : pageItems.map((resort, idx) => (
                <tr key={resort.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"}`}>
                        <MdOutlineBeachAccess size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${titleCls}`}>{resort.name}</p>
                        <p className={`text-xs truncate ${subText}`}>{resort.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{resort.phone || "—"}</td>
                  <td className={`px-6 py-4 text-sm max-w-xs truncate ${cellText}`}>{resort.address || "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{resort.branches?.length ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeStatus status={resort.status} dark={dark} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-[8px] text-xs font-semibold transition-colors ${
                  page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"
                }`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
