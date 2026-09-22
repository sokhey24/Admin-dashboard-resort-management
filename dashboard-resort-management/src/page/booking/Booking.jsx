import { useEffect, useMemo, useState } from "react";
import { Form, Select, InputNumber, message, Button, Input } from "antd";
import { MdSearch, MdAdd, MdEdit, MdDelete, MdClose, MdPerson, MdPayment } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { fmtDateTime } from "../../util/fmtDateTime";
import { useNotificationStore } from "../../store/NotificationStore";
import { useBookingStore } from "../../store/BookingStore";
import { fmtAmt } from "../Payment/paymentHelpers";

const { Option } = Select;

const PAGE_SIZE = 8;

const BOOKING_STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "completed"];
const STATUSES = ["all", "pending", "confirmed", "checked_in", "checked_out", "cancelled", "completed"];

const STATUS_STYLE = {
  pending:    { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200",   dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  confirmed:  { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",      dark: "bg-green-900/40 text-green-400 ring-green-700" },
  checked_in: { dot: "bg-teal-500",   light: "bg-teal-50 text-teal-700 ring-teal-200",         dark: "bg-teal-900/40 text-teal-400 ring-teal-700" },
  checked_out:{ dot: "bg-purple-500", light: "bg-purple-50 text-purple-700 ring-purple-200",   dark: "bg-purple-900/40 text-purple-400 ring-purple-700" },
  cancelled:  { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",            dark: "bg-red-900/40 text-red-400 ring-red-700" },
  completed:  { dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",         dark: "bg-blue-900/40 text-blue-400 ring-blue-700" },
};

const formatStatus = (s) => !s ? "Pending" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

function BadgeWithDot({ status, dark }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? style.dark : style.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {formatStatus(status)}
    </span>
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
  const now = fmtDateTime(new Date().toISOString());
  const rooms    = booking.rooms    ?? [];
  const payments = booking.payments ?? [];
  const invoice  = booking.invoice  ?? null;

  const PAY_COLOR = {
    paid:     dark ? "bg-green-900/40 text-green-400"   : "bg-green-100 text-green-700",
    pending:  dark ? "bg-yellow-900/40 text-yellow-400" : "bg-yellow-100 text-yellow-700",
    failed:   dark ? "bg-red-900/40 text-red-400"       : "bg-red-100 text-red-700",
    refunded: dark ? "bg-orange-900/40 text-orange-400" : "bg-orange-100 text-orange-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 overflow-y-auto">
      <div className={`rounded-xl shadow-2xl w-full max-w-2xl ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <div>
            <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Check-out Summary</h3>
            <p className={`text-xs mt-0.5 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
              {booking.booking_code ?? `BK-${booking.id}`} · Check-out time: <span className="font-medium text-purple-500">{now}</span>
            </p>
          </div>
          <Button onClick={onClose} className={`p-1 rounded-lg ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#829AB1]"}`}>
            <MdClose size={16} />
          </Button>
        </div>

        <div className="px-6 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Guest */}
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
              <InfoRow label="Phone"    value={booking.user?.phone} dark={dark} />
              <InfoRow label="Adults"   value={booking.adults}      dark={dark} />
              <InfoRow label="Children" value={booking.children}    dark={dark} />
              {booking.special_requests && <InfoRow label="Special Requests" value={booking.special_requests} dark={dark} />}
            </div>
          </div>

          {/* Booking details */}
          <div>
            <SectionTitle icon={<MdReceipt size={14} />} label="Booking & Stay Details" dark={dark} />
            <div className={`rounded-xl p-3 ${dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}`}>
              <InfoRow label="Booking Code"          value={booking.booking_code ?? `BK-${booking.id}`} dark={dark} />
              <InfoRow label="Resort"                value={booking.resort?.name}                       dark={dark} />
              <InfoRow label="Check-in"              value={fmtDateTime(booking.check_in)}              dark={dark} />
              <InfoRow label="Check-out (Scheduled)" value={fmtDateTime(booking.check_out)}             dark={dark} />
              <InfoRow label="Check-out (Actual Now)" value={<span className="text-purple-500 font-semibold">{now}</span>} dark={dark} />
              <InfoRow label="Status"      value={booking.status?.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())} dark={dark} />
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
                    <tr>{["Room","Type","Floor","Price/Night"].map(h => (
                      <th key={h} className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{h}</th>
                    ))}</tr>
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
                    <tr>{["Amount","Method","Status","Date"].map(h => (
                      <th key={h} className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className={`divide-y ${dark ? "divide-gray-700" : "divide-gray-100"}`}>
                    {payments.map((p, i) => (
                      <tr key={p.id ?? i} className={dark ? "bg-gray-800" : "bg-white"}>
                        <td className={`px-3 py-2 text-xs font-medium ${dark ? "text-gray-200" : "text-[#102A43]"}`}>${Number(p.amount ?? 0).toLocaleString()}</td>
                        <td className={`px-3 py-2 text-xs ${dark ? "text-gray-400" : "text-[#486581]"}`}>{p.method ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAY_COLOR[p.status] ?? PAY_COLOR.pending}`}>
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
                <InfoRow label="Invoice #" value={invoice.invoice_number}                                                   dark={dark} />
                <InfoRow label="Subtotal"       value={`$${Number(invoice.amount         ?? 0).toLocaleString()}`} dark={dark} />
                <InfoRow label="Discount"       value={`-$${Number(invoice.discount      ?? 0).toLocaleString()}`} dark={dark} />
                <InfoRow label="Tax"            value={`$${Number(invoice.tax            ?? 0).toLocaleString()}`} dark={dark} />
                <InfoRow label="Service Charge" value={`$${Number(invoice.service_charge ?? 0).toLocaleString()}`} dark={dark} />
                <div className={`border-t mt-1 pt-1 ${dark ? "border-gray-600" : "border-[#D9E2EC]"}`}>
                  <InfoRow label="Total" value={<span className="text-green-500 font-bold">${Number(invoice.total ?? 0).toLocaleString()}</span>} dark={dark} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`flex justify-end gap-2 px-6 py-4 border-t ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <Button onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition-colors inline-flex items-center gap-1.5">
            <MdLogout size={14} /> {loading ? "Processing…" : "Confirm Check-out"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ booking, onClose, onDeleted, dark }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const res = await request(`admin/bookings/${booking.id}`, "delete");
    setDeleting(false);
    if (!res?.errors) { message.success("Booking deleted"); onDeleted(); onClose(); }
    else message.error("Failed to delete");
  };

  const modalClass = `rounded-xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`;
  const titleClass = `text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const textClass = `text-sm mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const strongClass = `font-medium ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const codeClass = `font-mono font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const warnClass = `text-xs mb-6 ${dark ? "text-red-400" : "text-red-500"}`;
  const cancelClass = `px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`;
  const deleteClass = "px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={modalClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={titleClass}>Delete Booking</h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <p className={textClass}>
          Are you sure you want to delete booking{" "}
          <span className={codeClass}>{booking.booking_code ?? `BK-${booking.id}`}</span>{" "}
          for <span className={strongClass}>{booking.user?.name ?? "this guest"}</span>?
        </p>
        <p className={warnClass}>This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className={cancelClass}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={deleting} className={deleteClass}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ booking, resorts, users, onClose, onSaved, dark }) {
  const isEdit = !!booking;
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedResort, setSelectedResort] = useState(booking?.resort_id ?? null);
  const { addBookingNotification } = useNotificationStore();
  const { updateBooking } = useBookingStore();
  const checkInWatch = Form.useWatch("check_in", form);
  const checkOutWatch = Form.useWatch("check_out", form);
  const roomIdsWatch = Form.useWatch("room_ids", form);

  const nights = useMemo(() => {
    if (!checkInWatch || !checkOutWatch) return 0;
    const a = new Date(checkInWatch);
    const b = new Date(checkOutWatch);
    const diff = Math.round((b - a) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkInWatch, checkOutWatch]);

  // Preview only — the API recalculates discount, tax and service charge on save.
  const estimate = useMemo(() => {
    const selected = rooms.filter((r) => (roomIdsWatch ?? []).includes(r.id));
    let subtotal = 0;
    let discount = 0;
    selected.forEach((r) => {
      const gross = Number(r.price_per_night ?? 0) * (nights || 0);
      const pct = Math.min(100, Math.max(0, Number(r.effective_discount_percent ?? 0) || 0));
      subtotal += gross;
      discount += Math.round(((gross * pct) / 100) * 100) / 100;
    });
    return { subtotal, discount, net: Math.round((subtotal - discount) * 100) / 100, nights };
  }, [rooms, roomIdsWatch, nights]);

  const nextStatuses = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["checked_in", "cancelled"],
    checked_in: ["completed", "cancelled"],
    checked_out: ["completed", "cancelled"],
    cancelled: [],
    completed: [],
  };

  useEffect(() => {
    if (isEdit) { form.setFieldsValue({ status: booking.status }); return; }
    form.resetFields();
  }, [booking, isEdit, form]);

  const fetchRooms = (resortId, checkIn, checkOut) => {
    if (!resortId || !checkIn || !checkOut) { setRooms([]); return; }
    setLoadingRooms(true);
    request(`admin/rooms?resort_id=${resortId}&check_in=${checkIn}&check_out=${checkOut}&per_page=50`, "get")
      .then((res) => {
        const all = Array.isArray(res?.data) ? res.data : [];
        setRooms(all.filter((r) => String(r.resort_id) === String(resortId) && r.status !== "maintenance"));
      })
      .finally(() => setLoadingRooms(false));
  };

  useEffect(() => {
    if (!isEdit) fetchRooms(selectedResort, checkInWatch, checkOutWatch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResort, checkInWatch, checkOutWatch, isEdit]);

  const handleResortChange = (value) => {
    setSelectedResort(value);
    form.setFieldValue("room_ids", []);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const payload = {
      resort_id: values.resort_id,
      user_id: values.user_id ?? null,
      adults: values.adults ?? 1,
      children: values.children ?? 0,
      special_requests: values.special_requests ?? null,
      room_ids: values.room_ids ?? [],
      check_in: values.check_in,
      check_out: values.check_out,
    };
    const res = await request("admin/bookings", "post", payload);
    setSaving(false);
    if (!res?.errors) {
      if (res?.data) addBookingNotification(res.data);
      message.success("Booking created");
      onSaved(); onClose();
    } else {
      message.error(res?.errors?.message ?? res?.errors?.room_ids?.help ?? res?.errors?.check_out?.help ?? "Failed to create booking");
    }
  };

  const handleEditSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/bookings/${booking.id}`, "put", values);
    setSaving(false);
    if (!res?.errors) {
      if (res?.data) updateBooking(res.data);
      message.success("Updated"); onSaved(); onClose();
    } else message.error(res?.errors?.message ?? res?.errors?.status?.[0] ?? "Failed to update");
  };

  const inputClass = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 ${dark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-[#829AB1]" : "bg-white border-[#D9E2EC] text-[#102A43]"}`;
  const labelClass = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const modalClass = `rounded-xl shadow-2xl w-full max-w-lg p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`;
  const titleClass = `text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const cancelClass = `px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`;
  const saveClass = "px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-6">
      <div className={modalClass}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={titleClass}>{isEdit ? "Edit Booking" : "New Booking"}</h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <Form form={form} layout="vertical">
          {isEdit ? (
            <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select booking status" }]}>
              <Select className="w-full">
                {(nextStatuses[booking.status] ?? []).map((s) => <Option key={s} value={s}>{formatStatus(s)}</Option>)}
              </Select>
            </Form.Item>
          ) : (
            <>
              <div className="mb-4">
                <label className={labelClass}>Resort <span className="text-red-500">*</span></label>
                <Form.Item name="resort_id" rules={[{ required: true, message: "Please select a resort." }]}>
                  <Select className="w-full" placeholder="Select resort" onChange={handleResortChange} showSearch optionFilterProp="children">
                    {resorts.map((r) => <Option key={r.id} value={r.id}>{r.name}</Option>)}
                  </Select>
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelClass}>Check-in <span className="text-red-500">*</span></label>
                  <Form.Item name="check_in" rules={[{ required: true, message: "Select check-in date." }]}>
                    <Input type="date" className={inputClass} />
                  </Form.Item>
                </div>
                <div>
                  <label className={labelClass}>Check-out <span className="text-red-500">*</span></label>
                  <Form.Item name="check_out" rules={[{ required: true, message: "Select check-out date." }]}>
                    <Input type="date" className={inputClass} />
                  </Form.Item>
                </div>
              </div>
              <div className="mb-4">
                <label className={labelClass}>Rooms <span className="text-red-500">*</span></label>
                <Form.Item 
                name="room_ids" 
                rules={[
                  { required: true,
                   message: "Please select at least one room.", 
                   type: "array", min: 1 }]}>
                  <Select mode="multiple" className="w-full" placeholder={selectedResort && checkInWatch && checkOutWatch ? "Select available rooms" : "Select resort and dates first"} disabled={!selectedResort || !checkInWatch || !checkOutWatch} loading={loadingRooms} optionFilterProp="children" showSearch>
                    {rooms.map((r) => <Option key={r.id} value={r.id}>{r.room_number}{" — "}{r.roomType?.name ?? "Room"}{" ($"}{r.price_per_night}{"/night)"}</Option>)}
                  </Select>
                </Form.Item>
              </div>
              {nights > 0 && (
                <p className={`text-xs mb-3 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
                  {nights} night{nights === 1 ? "" : "s"}
                  {estimate.subtotal > 0
                    ? estimate.discount > 0
                      ? ` · ${fmtAmt(estimate.subtotal)} − ${fmtAmt(estimate.discount)} discount = ${fmtAmt(estimate.net)} (tax/service applied on save)`
                      : ` · estimated ${fmtAmt(estimate.subtotal)} (tax/service applied on save)`
                    : ""}
                </p>
              )}
              <div className="mb-4">
                <label className={labelClass}>Guest (User)</label>
                <Form.Item 
                name="user_id"
                rules = {
                  [
                    { required: true, message: "Please select a guest." }
                  ]
                }
                      >
                  <Select className="w-full" placeholder="Select guest" showSearch optionFilterProp="children" allowClear>
                    {users.map((u) => <Option key={u.id} value={u.id}>{u.name}{" — "}{u.email}</Option>)}
                  </Select>
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelClass}>Adults</label>
                  <Form.Item name="adults" initialValue={1} noStyle>
                    <InputNumber min={1} className="w-full" />
                  </Form.Item>
                </div>
                <div>
                  <label className={labelClass}>Children</label>
                  <Form.Item name="children" initialValue={0} noStyle>
                    <InputNumber min={0} className="w-full" />
                  </Form.Item>
                </div>
              </div>
              <div className="mb-2">
                <label className={labelClass}>Special Requests</label>
                <Form.Item name="special_requests" noStyle>
                  <Input.TextArea rows={2} placeholder="Any special requests…" className={inputClass} />
                </Form.Item>
              </div>
            </>
          )}
        </Form>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} className={cancelClass}>Cancel</Button>
          <Button onClick={isEdit ? handleEditSave : handleSave} disabled={saving} className={saveClass}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Booking() {
  const dark = useDarkMode();
  const [bookings, setBookings] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { setBookings: setGlobalBookings, updateBooking } = useBookingStore();

  const load = async () => {
    setLoading(true);
    const res = await request("admin/bookings", "get");
    if (res?.data) { setBookings(res.data); setGlobalBookings(res.data); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    request("admin/resorts", "get").then((res) => { if (res?.data) setResorts(res.data); });
    request("admin/guests", "get").then((res) => {
      if (res?.data) setUsers(Array.isArray(res.data) ? res.data : []);
      else {
        request("admin/users", "get").then((u) => { if (u?.data) setUsers(Array.isArray(u.data) ? u.data : []); });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  {s === "all" ? "All" : formatStatus(s)}
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
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark_th}`}>Status</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${dark_th}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${dark_tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={9} className={`py-16 text-center text-sm ${dark_sub}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={9} className={`py-16 text-center text-sm ${dark_sub}`}>No bookings found</td></tr>
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
                    <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={booking.status} dark={dark} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button onClick={() => { setEditing(booking); setModal(true); }} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-colors ${dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"}`}>
                          <MdEdit size={14} /> Edit
                        </Button>
                        <Button onClick={() => setDeleting(booking)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-colors ${dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                          <MdDelete size={14} /> Delete
                        </Button>
                      </div>
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
        <BookingModal booking={editing} resorts={resorts} users={users} onClose={() => { setModal(false); setEditing(null); }} onSaved={load} dark={dark} />
      )}
      {deleting && (
        <DeleteModal booking={deleting} onClose={() => setDeleting(null)} onDeleted={load} dark={dark} />
      )}
    </div>
  );
}
