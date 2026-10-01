import { useEffect, useMemo, useState } from "react";
import { MdEdit, MdDelete, MdSearch, MdUnfoldMore, MdKeyboardArrowUp, MdKeyboardArrowDown, MdClose, MdPerson } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button, Select } from "antd";
import usePermission from "../../util/usePermission";

const STATUSES = ["all", "active", "inactive", "banned"];

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",   dark: "bg-green-900/40 text-green-400 ring-green-700"  },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  banned:   { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",          dark: "bg-red-900/40 text-red-400 ring-red-700"         },
};

const PAGE_SIZE = 10;

const PAYMENT_STATUS_STYLE = {
  paid:            { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",   dark: "bg-green-900/40 text-green-400 ring-green-700" },
  partially_paid:  { dot: "bg-amber-500",  light: "bg-amber-50 text-amber-800 ring-amber-200",   dark: "bg-amber-900/40 text-amber-400 ring-amber-700" },
  unpaid:          { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",         dark: "bg-red-900/40 text-red-400 ring-red-700" },
};

const PAYMENT_STATUS_LABEL = {
  paid: "Paid",
  partially_paid: "Partial",
  unpaid: "Unpaid",
};

function PaymentBadge({ status, dark }) {
  if (!status) {
    return <span className={`text-sm ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>—</span>;
  }
  const s = PAYMENT_STATUS_STYLE[status] ?? PAYMENT_STATUS_STYLE.unpaid;
  const label = PAYMENT_STATUS_LABEL[status] ?? status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function formatRooms(roomNumbers) {
  if (!Array.isArray(roomNumbers) || !roomNumbers.length) return "—";
  return roomNumbers.join(", ");
}

function Avatar({ name, src }) {
  if (src) return <img src={src} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full bg-[#FF6B00] flex items-center justify-center text-white font-semibold text-sm shrink-0">
      {name?.charAt(0).toUpperCase() ?? <MdPerson />}
    </div>
  );
}

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {(status ?? "inactive").charAt(0).toUpperCase() + (status ?? "inactive").slice(1)}
    </span>
  );
}

function SortIcon({ column, sortCol, sortDir, dark }) {
  const cls = dark ? "text-[#829AB1]" : "text-gray-400";
  const activeClass = dark ? "text-gray-200" : "text-[#486581]";
  if (sortCol !== column) return <MdUnfoldMore className={`text-base ${cls}`} />;
  return sortDir === "asc"
    ? <MdKeyboardArrowUp className={`text-base ${activeClass}`} />
    : <MdKeyboardArrowDown className={`text-base ${activeClass}`} />;
}

function buildEditForm(user) {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    gender: user.gender ?? "",
    status: user.status ?? "active",
    check_in: user.check_in ?? "",
    check_out: user.check_out ?? "",
    room_ids: Array.isArray(user.room_ids) ? user.room_ids.map((id) => Number(id)) : [],
    payment_status: user.payment_status ?? "",
  };
}

function EditModal({ user, onClose, onSaved, dark }) {
  const hasBooking = Boolean(user.latest_booking_id);
  const [form, setForm] = useState(() => buildEditForm(user));
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState({});

  useEffect(() => {
    if (!hasBooking || !user.resort_id || !form.check_in || !form.check_out) return;
    setLoadingRooms(true);
    const qs = new URLSearchParams({
      resort_id: String(user.resort_id),
      check_in: form.check_in,
      check_out: form.check_out,
      per_page: "50",
      include_booked: "1",
      exclude_booking_id: String(user.latest_booking_id),
    });
    request(`admin/rooms?${qs}`, "get")
      .then((res) => {
        const all = Array.isArray(res?.data) ? res.data : [];
        setRooms(all.filter((r) => String(r.resort_id) === String(user.resort_id) && r.status !== "maintenance"));
        setLoadingRooms(false);
      })
      .catch(() => setLoadingRooms(false));
  }, [hasBooking, user.resort_id, user.latest_booking_id, form.check_in, form.check_out]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email.";
    if (hasBooking) {
      if (!form.check_in) e.check_in = "Check-in is required.";
      if (!form.check_out) e.check_out = "Check-out is required.";
      else if (form.check_in && form.check_out <= form.check_in) {
        e.check_out = "Check-out must be after check-in.";
      }
      if (!form.room_ids?.length) e.room_ids = "Select at least one room.";
    }
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const { check_in, check_out, room_ids, payment_status, ...profile } = form;
    const res = await request(`admin/users/${user.id}`, "put", profile);
    if (res?.errors) {
      setSaving(false);
      setErrs({ _: res.errors.message ?? "Failed to save guest profile." });
      return;
    }

    if (hasBooking) {
      const bookingRes = await request(`admin/bookings/${user.latest_booking_id}`, "put", {
        check_in,
        check_out,
        room_ids,
      });
      if (bookingRes?.errors) {
        setSaving(false);
        setErrs({ _: bookingRes.errors.message ?? "Guest saved but booking could not be updated." });
        return;
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrs((p) => ({ ...p, [key]: undefined }));
  };

  const inputCls = (key) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
    errs[key] ? "border-red-400 focus:ring-red-400/40" : "focus:ring-[#FF6B00]/30 " + (dark ? "border-gray-600" : "border-[#D9E2EC]")
  } ${dark ? "bg-gray-700 text-gray-100 placeholder-[#829AB1]" : "bg-white text-[#102A43]"}`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const sectionCls = `text-xs font-bold uppercase tracking-wide ${dark ? "text-gray-400" : "text-[#829AB1]"}`;
  const errMsg = (key) => errs[key] && <p className="mt-1 text-xs text-red-500">{errs[key]}</p>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className={`rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Edit Guest</h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <div className="space-y-4">
          <p className={sectionCls}>Account</p>
          <div>
            <label className={labelCls}>Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={set("name")} className={inputCls("name")} />
            {errMsg("name")}
          </div>
          <div>
            <label className={labelCls}>Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={set("email")} className={inputCls("email")} />
            {errMsg("email")}
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={form.phone} onChange={set("phone")} className={inputCls("phone")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Gender</label>
              <select value={form.gender} onChange={set("gender")} className={inputCls("gender")}>
                <option value="">Select gender</option>
                {["male", "female", "other"].map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Account status</label>
              <select value={form.status} onChange={set("status")} className={inputCls("status")}>
                {["active", "inactive", "banned"].map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className={`border-t pt-4 ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
            <p className={`${sectionCls} mb-3`}>Latest booking</p>
            {!hasBooking ? (
              <p className={`text-sm ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>No booking yet — room and stay fields will appear after the guest books.</p>
            ) : (
              <>
                <div>
                  <label className={labelCls}>Room number <span className="text-red-500">*</span></label>
                  <Select
                    mode="multiple"
                    className="w-full"
                    placeholder="Select room(s)"
                    loading={loadingRooms}
                    value={form.room_ids}
                    onChange={(ids) => {
                      setForm((f) => ({ ...f, room_ids: ids }));
                      setErrs((p) => ({ ...p, room_ids: undefined }));
                    }}
                    optionFilterProp="label"
                    options={rooms.map((r) => ({
                      value: r.id,
                      label: `${r.room_number}${r.roomType?.name ? ` — ${r.roomType.name}` : ""}`,
                    }))}
                  />
                  {errMsg("room_ids")}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>Check-in <span className="text-red-500">*</span></label>
                    <input type="date" value={form.check_in} onChange={set("check_in")} className={inputCls("check_in")} />
                    {errMsg("check_in")}
                  </div>
                  <div>
                    <label className={labelCls}>Check-out <span className="text-red-500">*</span></label>
                    <input type="date" value={form.check_out} onChange={set("check_out")} className={inputCls("check_out")} />
                    {errMsg("check_out")}
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>Payment status</label>
                  <div className="mt-1 flex items-center gap-2">
                    <PaymentBadge status={form.payment_status} dark={dark} />
                    <span className={`text-xs ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>Updated from payments on the booking.</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {errs._ && <p className="text-xs text-red-500">{errs._}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ user, onClose, onDeleted, dark }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    const res = await request(`admin/users/${user.id}`, "delete");
    setLoading(false);
    if (!res?.errors) { onDeleted(); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <h3 className={`text-base font-semibold mb-2 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Delete Guest</h3>
        <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-[#486581]"}`}>
          Delete <span className="font-medium">{user.name}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ResortStaff() {
  const dark = useDarkMode();
  const { can, canAny } = usePermission();

  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const canEdit = canAny("resort.guests.update", "admin.users.update");
  const canDelete = can("admin.users.delete");
  const colSpan = (canEdit || canDelete) ? 11 : 10;

  const load = () => {
    setLoading(true);
    request("admin/guests", "get")
      .then((res) => {
        setGuests(Array.isArray(res?.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => {
        setGuests([]);
        setLoading(false);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return guests
      .filter((u) => (status === "all" || u.status === status) &&
        (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q)
          || formatRooms(u.room_numbers).toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [guests, search, status, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const cardHdr = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const title = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#486581]";
  const thead = dark ? "bg-gray-700/60" : "bg-[#F5F8FC]";
  const thText = dark ? "text-gray-400" : "text-[#486581]";
  const thHover = dark ? "hover:bg-gray-700" : "hover:bg-[#F5F8FC]";
  const tbody = dark ? "bg-gray-800 divide-gray-700" : "bg-white divide-[#D9E2EC]";
  const rowHover = dark ? "hover:bg-gray-700/50" : "hover:bg-[#F5F8FC]";
  const cellText = dark ? "text-gray-300" : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]" : "text-[#829AB1]";
  const divider = dark ? "divide-gray-700" : "divide-[#D9E2EC]";
  const filterBg = dark ? "bg-gray-700" : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-gray-400 hover:text-gray-200" : "text-[#486581] hover:text-[#102A43]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48 placeholder:text-[#829AB1]";
  const pageBtn = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold text-[#486581] hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";
  const actionBtn = `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
    dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
  }`;

  const HeadCell = ({ col, label, className = "" }) => (
    <th onClick={() => handleSort(col)}
      className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${thText} ${thHover} ${className}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon column={col} sortCol={sortCol} sortDir={sortDir} dark={dark} />
      </span>
    </th>
  );

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${title}`}>User Guest</h2>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${title}`}>Registered guests</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {filtered.length} guests
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex gap-1 rounded-lg p-1 ${filterBg}`}>
              {STATUSES.map((s) => (
                <Button key={s} onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${status === s ? filterAct : filterBtn}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, email…" className={searchCls} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No.</th>
                <HeadCell col="name" label="Guest" className="w-1/4" />
                <HeadCell col="status" label="Status" />
                <HeadCell col="email" label="Email" className="hidden lg:table-cell" />
                <HeadCell col="phone" label="Phone" />
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Room</th>
                <HeadCell col="check_in" label="Check-in" />
                <HeadCell col="check_out" label="Check-out" />
                <HeadCell col="payment_status" label="Payment" />
                <HeadCell col="created_at" label="Registered" />
                {(canEdit || canDelete) && (
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
                )}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={colSpan} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={colSpan} className={`py-16 text-center text-sm ${subText}`}>No registered guests yet. Guests appear here after they sign up on the resort website.</td></tr>
              ) : pageItems.map((user, idx) => (
                <tr key={user.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} src={user.profile_image_url} />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${title}`}>{user.name}</p>
                        <p className={`text-xs truncate lg:hidden ${subText}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BadgeWithDot status={user.status ?? "active"} dark={dark} />
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell ${cellText}`}>{user.email}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{user.phone ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${cellText}`}>{formatRooms(user.room_numbers)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{user.check_in ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{user.check_out ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentBadge status={user.payment_status} dark={dark} />
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellMuted}`}>{user.created_at?.slice(0, 10) ?? "—"}</td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && (
                          <Button onClick={() => setEditing(user)} className={actionBtn}>
                            <MdEdit size={14} /> Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button onClick={() => setDeleting(user)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}>
                            <MdDelete size={14} /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"
                }`}>{p}</Button>
            ))}
            <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>

      {editing && <EditModal user={editing} onClose={() => setEditing(null)} onSaved={load} dark={dark} />}
      {deleting && <DeleteConfirm user={deleting} onClose={() => setDeleting(null)} onDeleted={load} dark={dark} />}
    </div>
  );
}
