import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdAdd, MdClose, MdShield } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
import { request } from "../../util/request";
import usePermission from "../../util/usePermission";

const COLORS = ["bg-purple-500", "bg-blue-500", "bg-orange-500", "bg-green-500", "bg-pink-500", "bg-teal-500"];

function RoleModal({ role, onClose, onSaved, dark }) {
  const isEdit = !!role;
  const [form, setForm] = useState(
    isEdit
      ? { name: role.name, display_name: role.display_name ?? "", description: role.description ?? "" }
      : { name: "", display_name: "", description: "" }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = isEdit
      ? await request(`admin/roles/${role.id}`, "put", form)
      : await request("admin/roles", "post", form);
    setSaving(false);
    if (res?.data || res?.id) { onSaved(); onClose(); }
  };

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 ${
    dark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-[#829AB1]" : "bg-white border-[#D9E2EC] text-[#102A43]"
  }`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-md p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            {isEdit ? "Edit Role" : "Add Role"}
          </h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Role Slug</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} placeholder="e.g. resort_manager" disabled={isEdit} />
          </div>
          <div>
            <label className={labelCls}>Display Name</label>
            <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              className={inputCls} placeholder="e.g. Resort Manager" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={`${inputCls} resize-none`} rows={3} />
          </div>
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

export default function Role() {
  const dark = useDarkMode();
  const { can } = usePermission();
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding,  setAdding]  = useState(false);

  const load = () => {
    setLoading(true);
    request("admin/roles", "get").then(res => {
      setRoles(Array.isArray(res?.data) ? res.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    await request(`admin/roles/${id}`, "delete");
    load();
  };

  const card     = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText  = dark ? "text-gray-400" : "text-[#829AB1]";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-[26px] font-bold ${titleCls}`}>Role Management</h2>
        {can("admin.roles.create") && (
          <Button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00]">
            <MdAdd size={14} /> Add Role
          </Button>
        )}
      </div>

      {loading ? (
        <p className={`text-sm ${subText}`}>Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <div key={role.id} className={`rounded-xl border shadow-sm p-5 ${card}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${COLORS[i % COLORS.length]} flex items-center justify-center`}>
                  <MdShield size={14} className="text-white" />
                </div>
                <div className="flex gap-1.5">
                  {can("admin.roles.update") && (
                    <Button onClick={() => setEditing(role)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
                      }`}>
                      <MdEdit size={14} /> Edit
                    </Button>
                  )}
                  {can("admin.roles.delete") && (
                    <Button onClick={() => handleDelete(role.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}>
                      <MdDelete size={14} /> Delete
                    </Button>
                  )}
                </div>
              </div>
              <h3 className={`text-base font-bold mb-1 ${titleCls}`}>{role.display_name ?? role.name}</h3>
              <p className={`text-xs leading-relaxed mb-4 ${subText}`}>{role.description ?? "—"}</p>
              <div className={`flex items-center justify-between pt-3 border-t ${dark ? "border-gray-700" : "border-gray-100"}`}>
                <span className={`text-xs ${subText}`}>Permissions</span>
                <span className={`text-sm font-semibold ${titleCls}`}>{role.permissions?.length ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || adding) && (
        <RoleModal
          role={editing}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSaved={load}
          dark={dark}
        />
      )}
    </div>
  );
}
