import { useEffect, useMemo, useState } from "react";
import { Form, Select, InputNumber, message, Button, Input } from "antd";
import { MdClose } from "react-icons/md";
import { request } from "../../util/request";
import { useBookingStore } from "../../store/BookingStore";
import { withBranchScope } from "../../store/CatalogStore";
import { fmtAmt } from "../Payment/paymentHelpers";
import {
  BOOKING_NEXT_STATUSES,
  DEFAULT_BOOKING_TIME,
  combineDateAndTime,
  formatBookingStatus,
  stayDateOnly,
  stayRangeMs,
} from "./bookingFormUtils";

const { Option } = Select;

/** Create or edit booking (status transitions on edit). */
export default function BookingFormModal({ booking, resorts, branches, users, scopedBranchId, branchScopeLocked, onClose, onSaved, dark }) {
  const isEdit = !!booking;
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [dateChanges, setDateChanges] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedResort, setSelectedResort] = useState(booking?.resort_id ?? null);
  const [selectedBranch, setSelectedBranch] = useState(scopedBranchId ?? null);
  const { updateBooking } = useBookingStore();
  const checkInWatch = Form.useWatch("check_in", form);
  const checkOutWatch = Form.useWatch("check_out", form);
  const checkInTimeWatch = Form.useWatch("check_in_time", form);
  const checkOutTimeWatch = Form.useWatch("check_out_time", form);
  const roomIdsWatch = Form.useWatch("room_ids", form);

  const nights = useMemo(() => {
    const inDate = stayDateOnly(checkInWatch);
    const outDate = stayDateOnly(checkOutWatch);
    if (!inDate || !outDate) return 0;
    const a = new Date(`${inDate}T00:00:00`);
    const b = new Date(`${outDate}T00:00:00`);
    const diff = Math.round((b - a) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkInWatch, checkOutWatch]);

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

  useEffect(() => {
    if (!isEdit || !booking?.id) {
      setDateChanges([]);
      return;
    }
    request(`admin/bookings/${booking.id}`, "get").then((res) => {
      const payload = res?.data ?? res;
      const rows = payload?.date_changes ?? payload?.dateChanges ?? [];
      setDateChanges(Array.isArray(rows) ? rows : []);
    });
  }, [isEdit, booking?.id]);

  useEffect(() => {
    if (isEdit) { form.setFieldsValue({ status: booking.status }); return; }
    form.resetFields();
    form.setFieldsValue({
      check_in_time: DEFAULT_BOOKING_TIME,
      check_out_time: DEFAULT_BOOKING_TIME,
      ...(scopedBranchId ? { branch_id: scopedBranchId } : {}),
    });
    setSelectedBranch(scopedBranchId ?? null);
  }, [booking, isEdit, form, scopedBranchId]);

  const fetchRooms = (resortId, branchId, checkIn, checkOut) => {
    if (!resortId || !checkIn || !checkOut) { setRooms([]); return; }
    setLoadingRooms(true);
    let url = `admin/rooms?resort_id=${resortId}&check_in=${checkIn}&check_out=${checkOut}&per_page=50`;
    if (branchId) url = withBranchScope(url, branchId);
    request(url, "get")
      .then((res) => {
        const all = Array.isArray(res?.data) ? res.data : [];
        setRooms(all.filter((r) => String(r.resort_id) === String(resortId) && r.status !== "maintenance"));
      })
      .finally(() => setLoadingRooms(false));
  };

  useEffect(() => {
    if (!isEdit) {
      fetchRooms(selectedResort, selectedBranch, stayDateOnly(checkInWatch), stayDateOnly(checkOutWatch));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResort, selectedBranch, checkInWatch, checkOutWatch, isEdit]);

  const handleResortChange = (value) => {
    setSelectedResort(value);
    form.setFieldValue("room_ids", []);
    form.setFieldValue("branch_id", undefined);
    setSelectedBranch(null);
  };

  const handleBranchChange = (value) => {
    setSelectedBranch(value ?? null);
    form.setFieldValue("room_ids", []);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const payload = {
      resort_id: values.resort_id,
      branch_id: values.branch_id ?? scopedBranchId ?? null,
      user_id: values.user_id ?? null,
      adults: values.adults ?? 1,
      children: values.children ?? 0,
      special_requests: values.special_requests ?? null,
      room_ids: values.room_ids ?? [],
      check_in: combineDateAndTime(values.check_in, values.check_in_time),
      check_out: combineDateAndTime(values.check_out, values.check_out_time),
    };
    const res = await request("admin/bookings", "post", payload);
    setSaving(false);
    if (!res?.errors) {
      message.success("Booking created");
      onSaved();
      onClose();
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
      message.success("Updated");
      onSaved();
      onClose();
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
            <>
              <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select booking status" }]}>
                <Select className="w-full">
                  {(BOOKING_NEXT_STATUSES[booking.status] ?? []).map((s) => (
                    <Option key={s} value={s}>{formatBookingStatus(s)}</Option>
                  ))}
                </Select>
              </Form.Item>
              {dateChanges.length > 0 && (
                <div className={`mb-4 rounded-lg border p-3 text-xs ${dark ? "border-gray-600 bg-gray-700/40" : "border-[#D9E2EC] bg-[#F5F8FC]"}`}>
                  <p className={`font-semibold mb-2 ${dark ? "text-gray-200" : "text-[#102A43]"}`}>Date change history</p>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {dateChanges.map((row) => (
                      <li key={row.id} className={dark ? "text-gray-300" : "text-[#486581]"}>
                        <span className="font-medium">{row.previous_check_in} → {row.previous_check_out}</span>
                        {" "}to{" "}
                        <span className="font-medium text-[#FF6B00]">{row.new_check_in} → {row.new_check_out}</span>
                        <br />
                        Totals: ${Number(row.previous_total ?? 0).toFixed(2)} → ${Number(row.new_total ?? 0).toFixed(2)}
                        {row.price_difference != null && (
                          <span> (Δ ${Number(row.price_difference).toFixed(2)})</span>
                        )}
                        {row.changed_by?.name && <span className="block opacity-80">By {row.changed_by.name}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
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
              <div className="mb-4">
                <label className={labelClass}>Branch {(branchScopeLocked || scopedBranchId) ? <span className="text-red-500">*</span> : null}</label>
                <Form.Item
                  name="branch_id"
                  rules={branchScopeLocked || scopedBranchId ? [{ required: true, message: "Please select a branch." }] : []}
                >
                  <Select
                    className="w-full"
                    placeholder="Select branch"
                    allowClear={!branchScopeLocked}
                    disabled={branchScopeLocked && Boolean(scopedBranchId)}
                    onChange={handleBranchChange}
                    showSearch
                    optionFilterProp="children"
                  >
                    {branches
                      .filter((b) => !selectedResort || String(b.resort_id) === String(selectedResort))
                      .map((b) => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                  </Select>
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelClass}>Check-in date <span className="text-red-500">*</span></label>
                  <Form.Item name="check_in" rules={[{ required: true, message: "Select check-in date." }]}>
                    <Input type="date" className={inputClass} />
                  </Form.Item>
                </div>
                <div>
                  <label className={labelClass}>Check-in time</label>
                  <Form.Item
                    name="check_in_time"
                    initialValue={DEFAULT_BOOKING_TIME}
                    rules={[{ required: true, message: "Select check-in time." }]}
                  >
                    <Input type="time" className={inputClass} step={60} />
                  </Form.Item>
                </div>
                <div>
                  <label className={labelClass}>Check-out date <span className="text-red-500">*</span></label>
                  <Form.Item
                    name="check_out"
                    dependencies={["check_in", "check_in_time", "check_out_time"]}
                    rules={[
                      { required: true, message: "Select check-out date." },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const inDate = getFieldValue("check_in");
                          const inTime = getFieldValue("check_in_time");
                          const outTime = getFieldValue("check_out_time");
                          if (!value || !inDate) return Promise.resolve();
                          if (stayRangeMs(inDate, inTime, value, outTime) > 0) return Promise.resolve();
                          return Promise.reject(new Error("Check-out must be after check-in."));
                        },
                      }),
                    ]}
                  >
                    <Input type="date" className={inputClass} />
                  </Form.Item>
                </div>
                <div>
                  <label className={labelClass}>Check-out time</label>
                  <Form.Item
                    name="check_out_time"
                    initialValue={DEFAULT_BOOKING_TIME}
                    dependencies={["check_in", "check_in_time", "check_out"]}
                    rules={[
                      { required: true, message: "Select check-out time." },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const inDate = getFieldValue("check_in");
                          const inTime = getFieldValue("check_in_time");
                          const outDate = getFieldValue("check_out");
                          if (!outDate || !inDate) return Promise.resolve();
                          if (stayRangeMs(inDate, inTime, outDate, value) > 0) return Promise.resolve();
                          return Promise.reject(new Error("Check-out must be after check-in."));
                        },
                      }),
                    ]}
                  >
                    <Input type="time" className={inputClass} step={60} />
                  </Form.Item>
                </div>
              </div>
              {checkInWatch && checkOutWatch && stayRangeMs(checkInWatch, checkInTimeWatch, checkOutWatch, checkOutTimeWatch) <= 0 && (
                <p className="text-xs text-red-500 mb-3">Check-out date and time must be after check-in.</p>
              )}
              <div className="mb-4">
                <label className={labelClass}>Rooms <span className="text-red-500">*</span></label>
                <Form.Item
                  name="room_ids"
                  rules={[{ required: true, message: "Please select at least one room.", type: "array", min: 1 }]}
                >
                  <Select mode="multiple" className="w-full" placeholder={selectedResort && checkInWatch && checkOutWatch ? "Select available rooms" : "Select resort and dates first"} disabled={!selectedResort || !checkInWatch || !checkOutWatch} loading={loadingRooms} optionFilterProp="children" showSearch>
                    {rooms.map((r) => <Option key={r.id} value={r.id}>{r.room_number}{" â€” "}{r.roomType?.name ?? "Room"}{" ($"}{r.price_per_night}{"/night)"}</Option>)}
                  </Select>
                </Form.Item>
              </div>
              {nights > 0 && (
                <p className={`text-xs mb-3 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
                  {nights} night{nights === 1 ? "" : "s"}
                  {estimate.subtotal > 0
                    ? estimate.discount > 0
                      ? ` Â· ${fmtAmt(estimate.subtotal)} âˆ’ ${fmtAmt(estimate.discount)} discount = ${fmtAmt(estimate.net)} (tax/service applied on save)`
                      : ` Â· estimated ${fmtAmt(estimate.subtotal)} (tax/service applied on save)`
                    : ""}
                </p>
              )}
              <div className="mb-4">
                <label className={labelClass}>Guest (User)</label>
                <Form.Item name="user_id" rules={[{ required: true, message: "Please select a guest." }]}>
                  <Select className="w-full" placeholder="Select guest" showSearch optionFilterProp="children" allowClear>
                    {users.map((u) => <Option key={u.id} value={u.id}>{u.name}{" â€” "}{u.email}</Option>)}
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
                  <Input.TextArea rows={2} placeholder="Any special requestsâ€¦" className={inputClass} />
                </Form.Item>
              </div>
            </>
          )}
        </Form>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} className={cancelClass}>Cancel</Button>
          <Button onClick={isEdit ? handleEditSave : handleSave} disabled={saving} className={saveClass}>
            {saving ? "Savingâ€¦" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
