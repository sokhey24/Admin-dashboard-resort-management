import { useMemo, useState } from "react";
import { MdSearch, MdPrint } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";

const PAGE_SIZE = 8;

const DATA = [
  { key: 1, id: "#B001", table: "T03", guest: "Carlos M.",  items: 2, subtotal: 40,  tax: 4,   total: 44,    status: "Paid"   },
  { key: 2, id: "#B002", table: "T02", guest: "John Smith", items: 3, subtotal: 98,  tax: 9.8, total: 107.8, status: "Unpaid" },
  { key: 3, id: "#B003", table: "T05", guest: "Emma Lee",   items: 4, subtotal: 68,  tax: 6.8, total: 74.8,  status: "Paid"   },
];

const STATUS_STYLE = {
  Paid:   { dot: "bg-green-500", light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  Unpaid: { dot: "bg-yellow-500",light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Unpaid;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function Billing() {
  const dark = useDarkMode();
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DATA.filter(d =>
      !q || d.id.toLowerCase().includes(q) || d.guest.toLowerCase().includes(q) || d.table.toLowerCase().includes(q) || d.status.toLowerCase().includes(q)
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalBilled = DATA.reduce((s, d) => s + d.total, 0);
  const totalPaid   = DATA.filter(d => d.status === "Paid").reduce((s, d) => s + d.total, 0);
  const totalUnpaid = DATA.filter(d => d.status === "Unpaid").reduce((s, d) => s + d.total, 0);

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
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Restaurant Billing</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Billed Today", value: `$${totalBilled.toFixed(1)}`, color: "#52c41a" },
          { label: "Paid",               value: `$${totalPaid.toFixed(1)}`,   color: "#52c41a" },
          { label: "Unpaid",             value: `$${totalUnpaid.toFixed(1)}`, color: "#faad14" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${card}`}>
            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${subText}`}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Bills</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {filtered.length} bills
            </span>
          </div>
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search bill, guest…" className={searchCls} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Bill #", "Table", "Guest", "Items", "Subtotal", "Tax (10%)", "Total", "Status", "Action"].map(h => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText} ${h === "No." ? "w-12 px-4" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {pageItems.length === 0 ? (
                <tr><td colSpan={10} className={`py-16 text-center text-sm ${subText}`}>No bills found</td></tr>
              ) : pageItems.map((b, idx) => (
                <tr key={b.key} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{b.id}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{b.table}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{b.guest}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{b.items}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>${b.subtotal}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>${b.tax}</td>
                  <td className={`px-6 py-4 text-sm font-semibold ${titleCls}`}>${b.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={b.status} dark={dark} /></td>
                  <td className="px-4 py-4 text-center">
                    <Button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-[#F5F8FC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
                      <MdPrint size={14} /> Print
                    </Button>
                  </td>
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
