import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useDarkMode } from "../../util/DarkModeContext";
import { request } from "../../util/request";

const PAGE_SIZE = 5;

const STATUS_MAP = {
  confirmed:   { color: "text-emerald-500", icon: <CheckCircle2 size={14} /> },
  pending:     { color: "text-yellow-500",  icon: <Clock3 size={14} /> },
  checked_in:  { color: "text-blue-500",    icon: <CheckCircle2 size={14} /> },
  checked_out: { color: "text-purple-500",  icon: <CheckCircle2 size={14} /> },
  cancelled:   { color: "text-red-500",     icon: <XCircle size={14} /> },
  completed:   { color: "text-green-500",   icon: <CheckCircle2 size={14} /> },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status?.toLowerCase()] ?? STATUS_MAP.pending;
  const label = status?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "—";
  return (
    <div className={`flex items-center gap-1 text-[10px] font-medium ${s.color}`}>
      {s.icon}
      {label}
    </div>
  );
}

export default function ListCardRecently() {
  const dark = useDarkMode();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    request("admin/bookings", "get")
      .then(res => { if (res?.data) setBookings(res.data); })
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const paged      = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const bg        = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-gray-100";
  const hdrBorder = dark ? "border-gray-700"               : "border-gray-100";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subCls    = dark ? "text-[#829AB1]"                 : "text-gray-400";
  const thCls     = dark ? "bg-gray-700/60 text-gray-400"  : "bg-[#F5F8FC]/50 text-gray-400";
  const rowBorder = dark ? "border-gray-700"               : "border-gray-50";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-[#F5F8FC]";
  const cellMain  = dark ? "text-gray-200"                 : "text-[#486581]";
  const cellSub   = dark ? "text-[#829AB1]"                 : "text-gray-400";
  const cellAmt   = dark ? "text-gray-300"                 : "text-[#486581]";
  const footerCls = dark ? "text-[#829AB1]"                 : "text-gray-400";
  const footerSpan= dark ? "text-gray-300"                 : "text-[#829AB1]";
  const btnBase   = `flex h-6 w-6 items-center justify-center rounded border transition-colors`;
  const btnNav    = dark ? "border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-30" : "border-gray-100 text-gray-300 hover:bg-[#F5F8FC] disabled:opacity-30";
  const btnPage   = (active) => active
    ? "bg-cyan-500 text-white border-cyan-500"
    : dark ? "border-gray-600 text-gray-400 hover:bg-gray-700" : "border-gray-100 text-[#829AB1] hover:bg-[#F5F8FC]";

  return (
    <div className={`w-full overflow-hidden rounded-xl border shadow-sm transition-colors duration-200 ${bg}`}>

      {/* Header */}
      <div className={`flex items-center justify-between border-b px-4 py-3 ${hdrBorder}`}>
        <div>
          <h2 className={`text-[13px] font-semibold ${titleCls}`}>Recent Reservations</h2>
          <p className={`mt-0.5 text-[9px] ${subCls}`}>Latest resort bookings</p>
        </div>
      </div>

      {/* Table Header */}
      <div className={`grid grid-cols-[1.2fr_1fr_1fr_1fr] border-b px-4 py-2 ${hdrBorder} ${thCls}`}>
        <div className="text-[9px] font-medium">Reservation ID</div>
        <div className="text-[9px] font-medium">Date</div>
        <div className="text-[9px] font-medium">Amount</div>
        <div className="text-[9px] font-medium">Status</div>
      </div>

      {/* Rows */}
      <div>
        {loading ? (
          <div className={`py-8 text-center text-[10px] ${subCls}`}>Loading…</div>
        ) : paged.length === 0 ? (
          <div className={`py-8 text-center text-[10px] ${subCls}`}>No reservations found</div>
        ) : paged.map((b) => (
          <div
            key={b.id}
            className={`grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center border-b px-4 py-2.5 transition ${rowBorder} ${rowHover}`}
          >
            {/* ID + Guest */}
            <div>
              <p className={`text-[10px] font-semibold ${cellMain}`}>
                {b.booking_code ?? `BK-${b.id}`}
              </p>
              <p className={`mt-0.5 truncate text-[9px] ${cellSub}`}>
                {b.user?.name ?? "—"}
              </p>
            </div>

            {/* Date + Room */}
            <div>
              <p className={`text-[9px] ${cellSub}`}>
                {b.check_in?.slice(0, 10) ?? "—"}
              </p>
              <p className={`mt-0.5 truncate text-[8px] ${cellSub}`}>
                {b.rooms?.[0]?.room_number ?? "—"}
              </p>
            </div>

            {/* Amount */}
            <div>
              <p className={`text-[10px] font-medium ${cellAmt}`}>
                ${Number(b.total_price ?? 0).toLocaleString()}
              </p>
            </div>

            {/* Status */}
            <StatusBadge status={b.status} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between px-4 py-2.5`}>
        <p className={`text-[8px] ${footerCls}`}>
          Showing <span className={`font-medium ${footerSpan}`}>{paged.length}</span> of{" "}
          <span className={`font-medium ${footerSpan}`}>{bookings.length}</span> reservations
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`${btnBase} text-[9px] font-medium ${btnPage(page === p)}`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
