import { useEffect, useMemo, useState } from "react";
import { Form, Select, message, Button } from "antd";
import { MdSearch, MdLogout, MdEdit, MdDelete, MdClose, MdPerson, MdHotel, MdPayment, MdReceipt } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { fmtDateTime } from "../../util/fmtDateTime";
import { useBookingStore } from "../../store/BookingStore";

const { Option } = Select;
const PAGE_SIZE = 8;

const STATUS_STYLE = {
  pending:     { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200",   dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  confirmed:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",       dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  checked_out: { dot: "bg-purple-500", light: "bg-purple-50 text-purple-700 ring-purple-200",    dark: "bg-purple-900/40 text-purple-400 ring-purple-700" },
  completed:   { dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",          dark: "bg-blue-900/40 text-blue-400 ring-blue-700"      },
  cancelled:   { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",             dark: "bg-red-900/40 text-red-400 ring-red-700"         },
};

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function EditModal({ booking, onClose, onSaved, dark }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  useEffect(() => { form.setFieldsValue({ status: booking.status }); }, [booking, form]);
  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/bookings/${booking.id}`, "put", values);
    setSaving(false);
    if (!res?.errors) { message.success("Updated"); onSaved(); onClose(); }
    else message.error("Failed to update");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Edit Booking</h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select a status" }]}>
            <Select>
              <Option value="confirmed">Confirmed</Option>
              <Option value="checked_out">Checked Out</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </Form>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} className={`px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60">{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, label, dark }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
      {icon} {label}
    </div>
  );
}

function InfoRow({ label, value, dark }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1">
      <span className={`text-xs ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{label}</span>
      <span className={`text-xs font-medium text-right ${dark ? "text-gray-200" : "text-[#102A43]"}`}>{value ?? "—"}</span>
    </div>
  );
}

function CheckoutDetailModal({ booking, onClose, onConfirm, loading, dark }) {
  const now = fmtDateTime(useBookingStore(s => s.checkoutTime));
  const rooms = booking.rooms ?? [];
  const payments = booking.payments ?? [];
  const invoice = booking.invoice ?? null;

  const STATUS_COLOR = {
    paid:    dark ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-700",
    pending: dark ? "bg-yellow-900/40 text-yellow-400" : "bg-yellow-100 text-yellow-700",
    failed:  dark ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-700",
    refunded:dark ? "bg-orange-900/40 text-orange-400" : "bg-orange-100 text-orange-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 overflow-y-auto">
      <div className={`rounded-xl shadow-2xl w-full max-w-2xl ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <div>
            <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Check-out Summary</h3>
            <p className={`text-xs mt-0.5 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
              {booking.booking_code ?? `BK-${booking.id}`} · Check-out time: <span className="font-medium text-purple-500">{now}</span>
            </p>
          </div>
          <button onClick={onClose} className={`p-1 rounded-lg ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#829AB1]"}`}>
            <MdClose size={14} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Guest Info */}
          <div>
            <SectionTitle icon={<MdPerson size={14} />} label="Guest Information" dark={dark} />
            <div className={`rounded-xl p-3 ${dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"}`}>
                  {booking.user?.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>{booking.user?.name ?? "—"}</p>
                  <p className={`text-xs ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{booking.user?.email ?? "—"}</p>
                </div>
              </div>
              <InfoRow label="Phone" value={booking.user?.phone} dark={dark} />
              <InfoRow label="Adults" value={booking.adults} dark={dark} />
              <InfoRow label="Children" value={booking.children} dark={dark} />
              {booking.special_requests && <InfoRow label="Special Requests" value={booking.special_requests} dark={dark} />}
            </div>
          </div>

          {/* Booking & Stay Dates */}
          <div>
            <SectionTitle icon={<MdReceipt size={14} />} label="Booking & Stay Details" dark={dark} />
            <div className={`rounded-xl p-3 ${dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}`}>
              <InfoRow label="Booking Code" value={booking.booking_code ?? `BK-${booking.id}`} dark={dark} />
              <InfoRow label="Resort" value={booking.resort?.name} dark={dark} />
              <InfoRow label="Check-in" value={fmtDateTime(booking.check_in)} dark={dark} />
              <InfoRow label="Check-out (Scheduled)" value={fmtDateTime(booking.check_out)} dark={dark} />
              <InfoRow label="Check-out (Actual Now)" value={<span className="text-purple-500 font-semibold">{now}</span>} dark={dark} />
              <InfoRow label="Status" value={booking.status?.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())} dark={dark} />
              <InfoRow label="Total Amount" value={`$${Number(booking.total_amount ?? 0).toLocaleString()}`} dark={dark} />
            </div>
          </div>

          {/* Rooms */}
          {rooms.length > 0 && (
            <div>
              <SectionTitle icon={<MdHotel size={14} />} label={`Rooms (${rooms.length})`} dark={dark} />
              <div className={`rounded-xl overflow-hidden border ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
                <table className="min-w-full">
                  <thead className={dark ? "bg-gray-700/60" : "bg-[#F5F8FC]"}>
                    <tr>
                      {["Room", "Type", "Floor", "Price/Night"].map(h => (
                        <th key={h} className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dark ? "divide-gray-700" : "divide-gray-100"}`}>
                    {rooms.map(r => (
                      <tr key={r.id} className={dark ? "bg-gray-800" : "bg-white"}>
                        <td className={`px-3 py-2 text-xs font-medium ${dark ? "text-gray-200" : "text-[#102A43]"}`}>{r.room_number}</td>
                        <td className={`px-3 py-2 text-xs ${dark ? "text-gray-400" : "text-[#486581]"}`}>{r.roomType?.name ?? "—"}</td>
                        <td className={`px-3 py-2 text-xs ${dark ? "text-gray-400" : "text-[#486581]"}`}>{r.floor ?? "—"}</td>
                        <td className={`px-3 py-2 text-xs ${dark ? "text-gray-400" : "text-[#486581]"}`}>${Number(r.price_per_night ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <div>
              <SectionTitle icon={<MdPayment size={14} />} label={`Payments (${payments.length})`} dark={dark} />
              <div className={`rounded-xl overflow-hidden border ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
                <table className="min-w-full">
                  <thead className={dark ? "bg-gray-700/60" : "bg-[#F5F8FC]"}>
                    <tr>
                      {["Amount", "Method", "Status", "Date"].map(h => (
                        <th key={h} className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dark ? "divide-gray-700" : "divide-gray-100"}`}>
                    {payments.map((p, i) => (
                      <tr key={p.id ?? i} className={dark ? "bg-gray-800" : "bg-white"}>
                        <td className={`px-3 py-2 text-xs font-medium ${dark ? "text-gray-200" : "text-[#102A43]"}`}>${Number(p.amount ?? 0).toLocaleString()}</td>
                        <td className={`px-3 py-2 text-xs ${dark ? "text-gray-400" : "text-[#486581]"}`}>{p.method ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status] ?? STATUS_COLOR.pending}`}>
                            {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-xs ${dark ? "text-gray-400" : "text-[#486581]"}`}>{p.paid_at ? fmtDateTime(p.paid_at) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoice */}
          {invoice && (
            <div>
              <SectionTitle icon={<MdReceipt size={14} />} label="Invoice" dark={dark} />
              <div className={`rounded-xl p-3 ${dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}`}>
                <InfoRow label="Invoice #" value={invoice.invoice_number} dark={dark} />
                <InfoRow label="Subtotal" value={`$${Number(invoice.subtotal ?? 0).toLocaleString()}`} dark={dark} />
                <InfoRow label="Tax" value={`$${Number(invoice.tax ?? 0).toLocaleString()}`} dark={dark} />
                <InfoRow label="Discount" value={`$${Number(invoice.discount ?? 0).toLocaleString()}`} dark={dark} />
                <div className={`border-t mt-1 pt-1 ${dark ? "border-gray-600" : "border-[#D9E2EC]"}`}>
                  <InfoRow label="Total" value={<span className="text-green-500 font-bold">${Number(invoice.total ?? 0).toLocaleString()}</span>} dark={dark} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 px-6 py-4 border-t ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <button onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition-colors flex items-center gap-1.5">
            <MdLogout size={14} /> {loading ? "Processing…" : "Confirm Check-out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutToday() {
  const dark = useDarkMode();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [editing,    setEditing]    = useState(null);
  const [confirm,    setConfirm]    = useState(null);
  const [checkoutDetail, setCheckoutDetail] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { updateBooking, setCheckoutTime } = useBookingStore();

  const load = async () => {
    setLoading(true);
    const res = await request("admin/bookings?filter=checkout_today", "get");
    if (res?.data) setBookings(res.data);
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirm(c => ({ ...c, loading: true }));
    const res = await request(`admin/bookings/${confirm.booking.id}`, "delete");
    if (!res?.errors) message.success("Deleted");
    else message.error("Failed");
    setConfirm(null);
    load();
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutDetail) return;
    setCheckoutLoading(true);
    const res = await request(`admin/bookings/${checkoutDetail.id}`, "put", { status: "checked_out" });
    setCheckoutLoading(false);
    if (!res?.errors) {
      if (res?.data) updateBooking(res.data);
      message.success("Checked out successfully"); setCheckoutDetail(null); load();
    } else message.error("Failed to check out");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(b =>
      !q || b.user?.name?.toLowerCase().includes(q) ||
      b.rooms?.[0]?.room_number?.toLowerCase().includes(q) ||
      b.check_out?.includes(q) || b.status?.includes(q)
    );
  }, [bookings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const checkedOut = bookings.filter(b => b.status === "checked_out" || b.status === "completed").length;
  const due        = bookings.filter(b => b.status !== "checked_out" && b.status !== "completed").length;

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
    delete: { title: "Delete Booking", confirmText: "Yes, Delete", danger: true, sub: "This action cannot be undone." },
  };

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Check-out Today</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Check-outs Today", value: bookings.length, color: "#1677ff" },
          { label: "Checked Out",            value: checkedOut,      color: "#52c41a" },
          { label: "Due",                    value: due,             color: "#faad14" },
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
            <span className={`text-[18px] font-semibold ${titleCls}`}>Check-outs — {new Date().toDateString()}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-blue-50 text-blue-700 ring-blue-200"}`}>
              {filtered.length} records
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
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>No check-outs found</td></tr>
              ) : pageItems.map((b, idx) => (
                <tr key={b.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{b.user?.name ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{b.rooms?.[0]?.room_number ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{fmtDateTime(b.check_in)}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{fmtDateTime(b.check_out)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={b.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => { setCheckoutTime(new Date().toISOString()); setCheckoutDetail(b); }}
                        disabled={b.status === "checked_out" || b.status === "completed"}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${dark ? "bg-purple-900/40 text-purple-400 hover:bg-purple-900/70" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}>
                        <MdLogout size={14} /> Check Out
                      </Button>
                      <Button onClick={() => setEditing(b)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"}`}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button onClick={() => setConfirm({ booking: b, type: "delete", loading: false })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        <MdDelete size={14} /> Delete
                      </Button>
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

      {editing && <EditModal booking={editing} onClose={() => setEditing(null)} onSaved={load} dark={dark} />}

      {checkoutDetail && (
        <CheckoutDetailModal
          booking={checkoutDetail}
          onClose={() => setCheckoutDetail(null)}
          onConfirm={handleCheckoutConfirm}
          loading={checkoutLoading}
          dark={dark}
        />
      )}

      {confirm && (() => {
        const cfg = confirmConfig[confirm.type];
        const name = confirm.booking.user?.name ?? "this guest";
        const code = confirm.booking.booking_code ?? `BK-${confirm.booking.id}`;
        return (
          <ConfirmDialog open dark={dark} title={cfg.title}
            message={`Are you sure you want to delete booking ${code} for ${name}?`}
            sub={cfg.sub} confirmText={cfg.confirmText} danger={cfg.danger}
            loading={confirm.loading} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />
        );
      })()}
    </div>
  );
}
