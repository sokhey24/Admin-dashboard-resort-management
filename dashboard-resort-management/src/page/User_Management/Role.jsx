import { useState } from "react";
import { MdEdit, MdDelete, MdAdd, MdClose, MdShield } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";

const SAMPLE_ROLES = [
  { id: 1, name: "admin",              label: "Admin",              description: "Full system access — manage all modules, users, and settings.", users: 2, color: "bg-purple-500" },
  { id: 2, name: "resort_manager",     label: "Resort Manager",     description: "Manage resort operations: rooms, bookings, facilities, and branches.", users: 3, color: "bg-blue-500" },
  { id: 3, name: "restaurant_manager", label: "Restaurant Manager", description: "Manage restaurant: menu, orders, table reservations, and billing.", users: 2, color: "bg-orange-500" },
];

function RoleModal({ role, onClose, onSaved, dark }) {
  const isEdit = !!role;
  const [form, setForm] = useState(
    isEdit
      ? { label: role.label, description: role.description }
      : { label: "", description: "" }
  );

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/40 ${
    dark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
  }`;
  const labelCls = `block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-gray-900"}`}>
            {isEdit ? "Edit Role" : "Add Role"}
          </h3>
          <Button onClick={onClose} className={`${dark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}>
            <MdClose size={20} />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Role Name</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className={inputCls} placeholder="e.g. Resort Manager" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={`${inputCls} resize-none`} rows={3} placeholder="Describe this role's permissions…" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
            Cancel
          </Button>
          <Button onClick={() => { onSaved(); onClose(); }}
            className="px-4 py-2 text-sm rounded-lg bg-[#0f2744] text-white hover:bg-[#1a3a5c] transition-colors">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Role() {
  const dark = useDarkMode();
  const [roles,   setRoles]   = useState(SAMPLE_ROLES);
  const [editing, setEditing] = useState(null);
  const [adding,  setAdding]  = useState(false);

  const card    = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const titleCls = dark ? "text-gray-100" : "text-gray-900";
  const subText  = dark ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${titleCls}`}>Role Management</h2>
        <Button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-[#0f2744] text-white hover:bg-[#1a3a5c] transition-colors">
          <MdAdd size={18} /> Add Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map(role => (
          <div key={role.id} className={`rounded-2xl border shadow-sm p-5 ${card}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${role.color} flex items-center justify-center`}>
                <MdShield size={22} className="text-white" />
              </div>
              <div className="flex gap-1.5">
                <Button onClick={() => setEditing(role)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}>
                  <MdEdit size={13} /> Edit
                </Button>
                <Button
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}>
                  <MdDelete size={13} /> Delete
                </Button>
              </div>
            </div>
            <h3 className={`text-base font-bold mb-1 ${titleCls}`}>{role.label}</h3>
            <p className={`text-xs leading-relaxed mb-4 ${subText}`}>{role.description}</p>
            <div className={`flex items-center justify-between pt-3 border-t ${dark ? "border-gray-700" : "border-gray-100"}`}>
              <span className={`text-xs ${subText}`}>Assigned users</span>
              <span className={`text-sm font-semibold ${titleCls}`}>{role.users}</span>
            </div>
          </div>
        ))}
      </div>

      {(editing || adding) && (
        <RoleModal
          role={editing}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSaved={() => {}}
          dark={dark}
        />
      )}
    </div>
  );
}
