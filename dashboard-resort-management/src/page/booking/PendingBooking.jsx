import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message, Button } from "antd";
import { MdSearch, MdCheck, MdClose } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { fmtDateTime } from "../../util/fmtDateTime";

const PAGE_SIZE = 8;

const STATUS_STYLE = {
  pending:   { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200",  dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  confirmed: { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",     dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  checked_in:{ dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",        dark: "bg-blue-900/40 text-blue-400 ring-blue-700"      },
  cancelled: { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",            dark: "bg-red-900/40 text-red-400 ring-red-700"         },
  completed: { dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",         dark: "bg-blue-900/40 text-blue-400 ring-blue-700"      },
};

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

const STATUS_BY_TYPE = {
  checkin: "checked_in",
  cancel: "cancelled",
};

const ACTION_LABEL = {
  checkin: "check in",
  cancel: "cancel",
  delete: "delete",
};

export default function PendingBooking() {
  const dark = useDarkMode();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [confirm,  setConfirm]  = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await request("admin/bookings?status=pending", "get");
    if (res?.data) setBookings(res.data.filter(b => b.status === "pending"));
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirm(c => ({ ...c, loading: true }));
    const { booking, type } = confirm;
    let res;
    if (type === "delete") {
      res = await request(`admin/bookings/${booking.id}`, "delete");
      if (!res?.errors) message.success("Deleted");
    } else {
      const status = STATUS_BY_TYPE[type];
      res = await request(`admin/bookings/${booking.id}`, "put", { status });
      if (!res?.errors) message.success(type === "checkin" ? "Checked in" : `Booking ${status}`);
    }
    if (res?.errors) {
      message.error(res.errors.message ?? res.errors.status?.[0] ?? "Failed");
      setConfirm(null);
      return;
    }
    setConfirm(null);
    if (type === "checkin") {
      navigate("/booking/checkin");
      return;
    }
    load();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(b =>
      !q || b.user?.name?.toLowerCase().includes(q) ||
      b.rooms?.[0]?.room_number?.toLowerCase().includes(q) ||
      b.check_in?.includes(q) || b.check_out?.includes(q)
    );
  }, [bookings, search]);

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

  const confirmConfig = {
    delete:  { title: "Delete Booking",  confirmText: "Yes, Delete",  danger: true,  sub: "This action cannot be undone." },
    checkin: { title: "Check In Guest",  confirmText: "Yes, Check In", danger: false, sub: "Guest will appear on Check-in Today and Check-out Today." },
    cancel:  { title: "Cancel Booking",  confirmText: "Yes, Cancel",  danger: true,  sub: null },
  };

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Pending Bookings</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "Pending Approvals", value: bookings.length,                         color: "#faad14" },
          { label: "Awaiting Payment",  value: bookings.filter(b => !b.payment).length, color: "#ff4d4f" },
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
            <span className={`text-[18px] font-semibold ${titleCls}`}>Pending Booking List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-yellow-900/40 text-yellow-400 ring-yellow-700" : "bg-yellow-50 text-yellow-700 ring-yellow-200"}`}>
              {filtered.length} bookings
            </span>
          </div>
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search guest, room…" className={searchCls} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Guest", "Room", "Check-in", "Check-out", "Status", "Action"].map(h => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText} ${h === "No." ? "w-12 px-4" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>No pending bookings found</td></tr>
              ) : pageItems.map((b, idx) => (
                <tr key={b.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{b.user?.name ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{b.rooms?.[0]?.room_number ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{fmtDateTime(b.check_in)}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{fmtDateTime(b.check_out)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={b.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <Button type="button" onClick={() => setConfirm({ booking: b, type: "checkin", loading: false })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-green-900/40 text-green-400 hover:bg-green-900/70" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                        <MdCheck size={14} /> Check-in
                      </Button>
                      <Button onClick={() => setConfirm({ booking: b, type: "cancel", loading: false })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-orange-900/40 text-orange-400 hover:bg-orange-900/70" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}>
                        <MdClose size={14} /> Cancel
                      </Button>
                      {/* <Button onClick={() => setConfirm({ booking: b, type: "delete", loading: false })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        <MdDelete size={14} /> Delete
                      </Button> */}
                    </div>
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

      {confirm && (() => {
        const cfg = confirmConfig[confirm.type];
        const name = confirm.booking.user?.name ?? "this guest";
        const code = confirm.booking.booking_code ?? `BK-${confirm.booking.id}`;
        return (
          <ConfirmDialog
            open
            dark={dark}
            title={cfg.title}
            message={`Are you sure you want to ${ACTION_LABEL[confirm.type]} booking ${code} for ${name}?`}
            sub={cfg.sub}
            confirmText={cfg.confirmText}
            danger={cfg.danger}
            loading={confirm.loading}
            onConfirm={handleConfirm}
            onCancel={() => setConfirm(null)}
          />
        );
      })()}
    </div>
  );
}
