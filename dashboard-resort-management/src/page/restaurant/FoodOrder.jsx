import { useEffect, useMemo, useState } from "react";
import { Modal, Form, Select, message, Button } from "antd";
import { MdSearch, MdEdit, MdDelete } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import usePermission from "../../util/usePermission";
import useRole from "../../util/useRole";

const { Option } = Select;
const PAGE_SIZE = 8;
const STATUSES  = ["all", "pending", "processing", "completed", "cancelled"];

const STATUS_STYLE = {
  pending:    { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  processing: { dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",        dark: "bg-blue-900/40 text-blue-400 ring-blue-700"      },
  completed:  { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",     dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  cancelled:  { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",            dark: "bg-red-900/40 text-red-400 ring-red-700"         },
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

export default function FoodOrder() {
  const dark = useDarkMode();
  const { canAny } = usePermission();
  const { isAdmin } = useRole();
  const canEdit = isAdmin || canAny("admin.restaurand.update", "restaurant.orders.update");
  const canDelete = isAdmin || canAny("admin.restaurand.delete", "restaurant.orders.delete");
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    request("admin/food-orders", "get").then(res => {
      if (res?.data) setOrders(res.data);
      setLoading(false);
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const openEdit = (r) => { setEditing(r); form.setFieldsValue({ status: r.status }); setModal(true); };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    const res = await request(`admin/food-orders/${id}`, "delete");
    if (!res?.errors) { message.success("Order deleted"); load(); }
    else message.error("Failed to delete");
  };
  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(`admin/food-orders/${editing.id}`, "put", values);
    setSaving(false);
    if (!res?.errors) { message.success("Order updated"); setModal(false); load(); }
    else message.error("Failed to update");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o =>
      (statusTab === "all" || o.status === statusTab) &&
      (!q || String(o.id).includes(q) || o.user?.name?.toLowerCase().includes(q) || o.restaurantTable?.table_number?.toLowerCase().includes(q))
    );
  }, [orders, search, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pending    = orders.filter(o => o.status === "pending").length;
  const completed  = orders.filter(o => o.status === "completed").length;

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
  const filterBg  = dark ? "bg-gray-700"                   : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Food Orders</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Orders",     value: orders.length, color: "#1677ff" },
          { label: "Pending Orders",   value: pending,       color: "#faad14" },
          { label: "Completed Orders", value: completed,     color: "#52c41a" },
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
            <span className={`text-[18px] font-semibold ${titleCls}`}>All Orders</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {filtered.length} orders
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex gap-1 rounded-lg p-1 ${filterBg}`}>
              {STATUSES.map(s => (
                <Button key={s} onClick={() => { setStatusTab(s); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${statusTab === s ? filterAct : filterBtn}`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search order, customer…" className={searchCls} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Order #", "Table", "Customer", "Total", "Status", "Date", "Action"].map(h => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText} ${h === "No." ? "w-12 px-4" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>No orders found</td></tr>
              ) : pageItems.map((o, idx) => (
                <tr key={o.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>#{o.id}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{o.restaurantTable?.table_number ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{o.user?.name ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>${o.total ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={o.status} dark={dark} /></td>
                  <td className={`px-6 py-4 text-sm ${cellMuted}`}>{o.created_at?.slice(0, 10) ?? "—"}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit && (
                        <Button onClick={() => openEdit(o)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"}`}>
                          <MdEdit size={14} /> Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button onClick={() => handleDelete(o.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
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

      <Modal title="Edit Order" open={modal} onOk={handleSave} onCancel={() => setModal(false)} confirmLoading={saving} okText="Save">
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="processing">Processing</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
