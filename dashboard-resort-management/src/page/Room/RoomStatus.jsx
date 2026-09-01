import { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Select, message, Button, InputNumber } from "antd";
import { MdSearch, MdEdit, MdDelete } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";

const { Option } = Select;
const PAGE_SIZE = 8;

const STATUS_STYLE = {
  available:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  occupied:    { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",            dark: "bg-red-900/40 text-red-400 ring-red-700"         },
  maintenance: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200",  dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.maintenance;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function RoomStatus() {
  const dark = useDarkMode();
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    request("admin/rooms", "get").then(res => {
      if (res?.data) setRooms(res.data);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openEdit = (r) => { setEditing(r); form.setFieldsValue(r); setModal(true); };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this room?")) return;
    const res = await request(`admin/rooms/${id}`, "delete");
    if (res?.message) { message.success("Room deleted"); load(); }
    else message.error("Failed to delete");
  };
  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/rooms/${editing.id}`, "put", values);
    setSaving(false);
    if (res?.message) { message.success("Room updated"); setModal(false); load(); }
    else message.error("Failed to update");
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
                  <td className={`px-6 py-4 text-sm ${cellText}`}>${r.price_per_night ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={r.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => openEdit(r)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"}`}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button onClick={() => handleDelete(r.id)}
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

      <Modal title="Edit Room" open={modal} onOk={handleSave} onCancel={() => setModal(false)} confirmLoading={saving} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item name="room_number"     label="Room Number"  rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="floor"           label="Floor"><InputNumber className="w-full" /></Form.Item>
          <Form.Item name="price_per_night" label="Price/Night"><InputNumber className="w-full" prefix="$" /></Form.Item>
          <Form.Item name="status"          label="Status">
            <Select>
              <Option value="available">Available</Option>
              <Option value="occupied">Occupied</Option>
              <Option value="maintenance">Maintenance</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
