import { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Select, message, Button, InputNumber } from "antd";
import { MdSearch, MdEdit, MdDelete } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import usePermission from "../../util/usePermission";
import useRole from "../../util/useRole";
import { PriceWithDiscount } from "./RoomPrice.jsx";
import { MAX_DISCOUNT_PERCENT, ROOM_STATUSES, STATUS_STYLE, applyFormErrors, effectiveDiscountPercent, roomActionClass, roomModalOkClass, roomModalCancelClass } from "./roomHelpers";
import ConfirmDialog from "../../components/ConfirmDialog";

export function RoomStatusBadge({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.maintenance;
  const label = status ? status.replace(/_/g, " ") : "Unknown";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 capitalize ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

const PAGE_SIZE = 8;

function BadgeWithDot({ status, dark }) {
  return <RoomStatusBadge status={status} dark={dark} />;
}

export default function RoomStatus() {
  const dark = useDarkMode();
  const { canAny } = usePermission();
  const { isAdmin } = useRole();
  const canEdit = isAdmin || canAny("admin.resorts.update", "resort.rooms.update");
  const canDelete = isAdmin || canAny("admin.resorts.delete", "resort.rooms.delete");
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    request("admin/rooms", "get").then(res => {
      if (res?.data) setRooms(res.data);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openEdit = (r) => {
    setEditing(r);
    form.setFieldsValue({
      room_number: r.room_number,
      floor: r.floor,
      price_per_night: r.price_per_night != null ? Number(r.price_per_night) : undefined,
      discount_percent: r.discount_percent != null ? Number(r.discount_percent) : undefined,
      status: r.status,
      notes: r.notes,
    });
    setModal(true);
  };
  const handleDelete = async () => {
    if (!confirm) return;
    const id = confirm.room.id;
    setConfirm((c) => ({ ...c, loading: true }));
    const res = await request(`admin/rooms/${id}`, "delete");
    setConfirm(null);
    if (res?.errors) {
      message.error(res.errors.message ?? "Failed to delete");
      return;
    }
    message.success("Room deleted");
    load();
  };
  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/rooms/${editing.id}`, "put", {
      room_number: values.room_number,
      floor: values.floor != null ? String(values.floor) : null,
      price_per_night: values.price_per_night,
      discount_percent: values.discount_percent ?? null,
      status: values.status,
      notes: values.notes,
    });
    setSaving(false);
    if (res?.errors) {
      applyFormErrors(form, res.errors);
      message.error(res.errors.message ?? "Unable to update room.");
      return;
    }
    message.success("Room updated");
    setModal(false);
    load();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter(r =>
      !q ||
      r.room_number?.toLowerCase().includes(q) ||
      r.room_type?.name?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q) ||
      String(r.floor ?? "").includes(q)
    );
  }, [rooms, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const available   = rooms.filter(r => r.status === "available").length;
  const occupied    = rooms.filter(r => r.status === "occupied").length;
  const maintenance = rooms.filter(r => r.status === "maintenance").length;

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
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Room Status</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Available",   value: available,   color: "#52c41a" },
          { label: "Occupied",    value: occupied,    color: "#ff4d4f" },
          { label: "Maintenance", value: maintenance, color: "#faad14" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${card}`}>
            <p className={`text-[13px] font-semibold uppercase tracking-wide mb-1 ${subText}`}>{s.label}</p>
            <p className="text-[28px] font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>All Rooms</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {filtered.length} rooms
            </span>
          </div>
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search room, type, status…" className={searchCls} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Room", "Type", "Floor", "Price/Night", "Status", "Action"].map(h => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText} ${h === "No." ? "w-12 px-4" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>No rooms found</td></tr>
              ) : pageItems.map((r, idx) => (
                <tr key={r.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{r.room_number}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{r.room_type?.name ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{r.floor ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>
                    <PriceWithDiscount
                      price={r.price_per_night}
                      percent={r.effective_discount_percent ?? effectiveDiscountPercent(r)}
                      dark={dark}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={r.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit && (
                        <Button className={roomActionClass(dark)} onClick={() => openEdit(r)}>
                          <MdEdit size={14} /> Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button className={roomActionClass(dark)} onClick={() => setConfirm({ room: r, loading: false })}>
                          <MdDelete size={14} /> Delete
                        </Button>
                      )}
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

      <Modal
        title={<span className={titleCls} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>Edit Room</span>}
        open={modal}
        onOk={handleSave}
        onCancel={() => setModal(false)}
        confirmLoading={saving}
        okText="Save"
        okButtonProps={{ className: roomModalOkClass() }}
        cancelButtonProps={{ className: roomModalCancelClass(dark) }}
        className={dark ? "[&_.ant-modal-content]:!bg-gray-800 [&_.ant-modal-header]:!bg-gray-800 [&_.ant-modal-close]:!text-gray-300" : ""}
        styles={{
          content: { fontFamily: "Inter, Poppins, sans-serif" },
          header: { fontFamily: "Inter, Poppins, sans-serif" },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="room_number"     label="Room Number"  rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="floor"           label="Floor"><InputNumber className="w-full" /></Form.Item>
          <Form.Item name="price_per_night" label="Price/Night"><InputNumber className="w-full" prefix="$" /></Form.Item>
          <Form.Item
            name="discount_percent"
            label="Discount (%)"
            tooltip="Leave empty to inherit the room type discount."
            rules={[{ type: "number", min: 0, max: MAX_DISCOUNT_PERCENT, message: "Discount must be between 0 and 100." }]}
          >
            <InputNumber min={0} max={MAX_DISCOUNT_PERCENT} step={0.5} className="w-full" suffix="%" placeholder="Inherit from room type" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={ROOM_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        dark={dark}
        title="Delete Room"
        message={confirm ? `Are you sure you want to delete room ${confirm.room.room_number}?` : ""}
        sub="This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        danger
        loading={!!confirm?.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
