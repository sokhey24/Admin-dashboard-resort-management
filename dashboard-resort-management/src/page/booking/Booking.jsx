import { useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { MdSearch, MdAdd, MdPerson } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { fmtDateTime } from "../../util/fmtDateTime";
import { useBookingStore } from "../../store/BookingStore";
import useCatalogData from "../../hooks/useCatalogData";
import { withBranchScope } from "../../store/CatalogStore";
import { useBranchStore } from "../../store/useBranchStore";
import { fmtAmt } from "../Payment/paymentHelpers";
import { formatBookingStatus } from "./bookingFormUtils";
import BookingFormModal from "./BookingFormModal";
import BookingDeleteModal from "./BookingDeleteModal";
import BookingStatusActions from "./BookingStatusActions";
import GuestFolioModal from "./GuestFolioModal";

const PAGE_SIZE = 8;
const STATUSES = ["all", "pending", "confirmed", "checked_in", "checked_out", "cancelled", "completed"];

const STATUS_STYLE = {
  pending: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  confirmed: { dot: "bg-green-500", light: "bg-green-50 text-green-700 ring-green-200", dark: "bg-green-900/40 text-green-400 ring-green-700" },
  checked_in: { dot: "bg-teal-500", light: "bg-teal-50 text-teal-700 ring-teal-200", dark: "bg-teal-900/40 text-teal-400 ring-teal-700" },
  checked_out: { dot: "bg-purple-500", light: "bg-purple-50 text-purple-700 ring-purple-200", dark: "bg-purple-900/40 text-purple-400 ring-purple-700" },
  cancelled: { dot: "bg-red-500", light: "bg-red-50 text-red-700 ring-red-200", dark: "bg-red-900/40 text-red-400 ring-red-700" },
  completed: { dot: "bg-blue-500", light: "bg-blue-50 text-blue-700 ring-blue-200", dark: "bg-blue-900/40 text-blue-400 ring-blue-700" },
};

function BadgeWithDot({ status, dark }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? style.dark : style.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {formatBookingStatus(status)}
    </span>
  );
}

export default function Booking() {
  const dark = useDarkMode();
  const [bookings, setBookings] = useState([]);
  const { resorts, branches } = useCatalogData({ autoFetch: false });
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branchScopeLocked = useBranchStore((s) => s.branchScopeLocked);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [folioBooking, setFolioBooking] = useState(null);
  const { setBookings: setGlobalBookings } = useBookingStore();

  const load = async () => {
    setLoading(true);
    const res = await request(withBranchScope("admin/bookings", selectedBranchId), "get");
    if (res?.data) { setBookings(res.data); setGlobalBookings(res.data); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    request("admin/guests", "get").then((res) => {
      if (res?.data) setUsers(Array.isArray(res.data) ? res.data : []);
      else {
        request("admin/users", "get").then((u) => { if (u?.data) setUsers(Array.isArray(u.data) ? u.data : []); });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter((b) => {
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchSearch = !q || b.booking_code?.toLowerCase().includes(q) || b.user?.name?.toLowerCase().includes(q) || b.user?.email?.toLowerCase().includes(q) || b.check_in?.includes(q) || b.check_out?.includes(q);
      return matchStatus && matchSearch;
    });
  }, [bookings, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const dark_card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const dark_header = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const dark_title = dark ? "text-gray-100" : "text-[#102A43]";
  const dark_sub = dark ? "text-gray-400" : "text-[#486581]";
  const dark_cell = dark ? "text-gray-300" : "text-[#486581]";
  const dark_muted = dark ? "text-[#829AB1]" : "text-[#829AB1]";
  const dark_thead = dark ? "bg-gray-700/60" : "bg-[#F5F8FC]";
  const dark_th = dark ? "text-gray-400" : "text-[#486581]";
  const dark_tbody = dark ? "bg-gray-800 divide-gray-700" : "bg-white divide-[#D9E2EC]";
  const dark_row = dark ? "hover:bg-gray-700/50" : "hover:bg-[#F5F8FC]";
  const dark_divide = dark ? "divide-gray-700" : "divide-[#D9E2EC]";
  const dark_filter = dark ? "bg-gray-700" : "bg-[#F5F8FC]";
  const dark_fbtn = dark ? "text-gray-400 hover:text-gray-200" : "text-[#486581] hover:text-[#102A43]";
  const dark_factive = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchClass = dark ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48" : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48 placeholder:text-[#829AB1]";
  const pageBtnClass = dark ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300" : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold text-[#486581] hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${dark_title}`}>Booking Management</h2>
      <div className={`rounded-xl shadow-sm border overflow-hidden ${dark_card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${dark_header}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-bold ${dark_title}`}>Booking List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FFF3E8] text-[#FF6B00] ring-[#FFD4A8]"}`}>
              {filtered.length} bookings
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex gap-1 rounded-lg p-1 overflow-x-auto ${dark_filter}`}>
              {STATUSES.map((s) => (
                <Button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === s ? dark_factive : dark_fbtn}`}>
                  {s === "all" ? "All" : formatBookingStatus(s)}
                </Button>
              ))}
            </div>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…" className={searchClass} />
            </div>
            <Button onClick={() => { setEditing(null); setModal(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] transition-colors">
              <MdAdd size={14} /> Add Booking
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${dark_divide}`}>
            <thead className={dark_thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${dark_th}`}>No.</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Guest</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Resort</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Rooms</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Check-in</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Check-out</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Total</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Balance</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Status</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${dark_th}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${dark_tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={10} className={`py-16 text-center text-sm ${dark_sub}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={10} className={`py-16 text-center text-sm ${dark_sub}`}>No bookings found</td></tr>
              ) : (
                pageItems.map((booking, index) => (
                  <tr key={booking.id} className={`transition-colors ${dark_row}`}>
                    <td className={`px-4 py-4 text-sm font-medium ${dark_muted}`}>{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"}`}>
                          {booking.user?.name?.charAt(0).toUpperCase() ?? <MdPerson size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${dark_title}`}>{booking.user?.name ?? "—"}</p>
                          <p className={`text-xs truncate ${dark_sub}`}>{booking.user?.email ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${dark_cell}`}>{booking.resort?.name ?? "—"}</td>
                    <td className={`px-6 py-4 text-sm ${dark_cell}`}>
                      {booking.rooms?.length ? booking.rooms.map((r) => (
                        <span key={r.id} className={`inline-block px-1.5 py-0.5 rounded text-xs mr-1 mb-0.5 ${dark ? "bg-gray-700 text-gray-300" : "bg-[#F5F8FC] text-[#486581]"}`}>{r.room_number}</span>
                      )) : "—"}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${dark_cell}`}>{fmtDateTime(booking.check_in)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${dark_cell}`}>{fmtDateTime(booking.check_out)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${dark_title}`}>${Number(booking.total_amount ?? 0).toLocaleString()}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${Number(booking.balance_due ?? 0) > 0.009 ? "text-amber-600" : "text-green-600"}`}>
                      {fmtAmt(booking.balance_due)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={booking.status} dark={dark} /></td>
                    <td className="px-4 py-4">
                      <BookingStatusActions
                        booking={booking}
                        dark={dark}
                        onEdit={(b) => { setEditing(b); setModal(true); }}
                        onDelete={(b) => setDeleting(b)}
                        onFolio={(b) => setFolioBooking(b)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${dark_header} ${dark_sub}`}>
          <span>Page {page} of {totalPages}{" · "}{filtered.length} records</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page === 1} className={pageBtnClass}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-[8px] text-xs font-semibold transition-colors ${page === n ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`}>{n}</Button>
            ))}
            <Button onClick={() => setPage((c) => Math.min(totalPages, c + 1))} disabled={page === totalPages} className={pageBtnClass}>Next</Button>
          </div>
        </div>
      </div>
      {modal && (
        <BookingFormModal
          booking={editing}
          resorts={resorts}
          branches={branches}
          users={users}
          scopedBranchId={selectedBranchId}
          branchScopeLocked={branchScopeLocked}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={load}
          dark={dark}
        />
      )}
      {deleting && (
        <BookingDeleteModal booking={deleting} onClose={() => setDeleting(null)} onDeleted={load} dark={dark} />
      )}
      {folioBooking && (
        <GuestFolioModal
          booking={folioBooking}
          open={Boolean(folioBooking)}
          onClose={() => setFolioBooking(null)}
          dark={dark}
        />
      )}
    </div>
  );
}
