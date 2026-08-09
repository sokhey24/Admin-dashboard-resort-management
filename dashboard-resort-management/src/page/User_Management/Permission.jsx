import { useState } from "react";
import { MdShield, MdCheck, MdClose } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
const MODULES = [
  "Dashboard", "Room Management", "Booking Management", "Resort Management",
  "Restaurant Management", "Customer Management", "User Management", "Settings",
];

const ACTIONS = ["View", "Create", "Edit", "Delete"];

const DEFAULT_PERMISSIONS = {
  admin: {
    "Dashboard": ["View", "Create", "Edit", "Delete"],
    "Room Management": ["View", "Create", "Edit", "Delete"],
    "Booking Management": ["View", "Create", "Edit", "Delete"],
    "Resort Management": ["View", "Create", "Edit", "Delete"],
    "Restaurant Management": ["View", "Create", "Edit", "Delete"],
    "Customer Management": ["View", "Create", "Edit", "Delete"],
    "User Management": ["View", "Create", "Edit", "Delete"],
    "Settings": ["View", "Create", "Edit", "Delete"],
  },
  resort_manager: {
    "Dashboard": [],
    "Room Management": ["View", "Create", "Edit", "Delete"],
    "Booking Management": ["View", "Create", "Edit"],
    "Resort Management": ["View", "Create", "Edit"],
    "Restaurant Management": [],
    "Customer Management": ["View"],
    "User Management": [],
    "Settings": ["View"],
  },
  restaurant_manager: {
    "Dashboard": [],
    "Room Management": [],
    "Booking Management": [],
    "Resort Management": [],
    "Restaurant Management": ["View", "Create", "Edit", "Delete"],
    "Customer Management": ["View"],
    "User Management": [],
    "Settings": ["View"],
  },
};

const ROLES = [
  { key: "admin",              label: "Admin",              color: "bg-purple-500" },
  { key: "resort_manager",     label: "Resort Manager",     color: "bg-blue-500"   },
  { key: "restaurant_manager", label: "Restaurant Manager", color: "bg-orange-500" },
];

export default function Permission() {
  const dark = useDarkMode();
  const [activeRole, setActiveRole] = useState("admin");
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS);
  const [saved, setSaved] = useState(false);

  const toggle = (module, action) => {
    setPerms(prev => {
      const current = prev[activeRole][module] ?? [];
      const updated  = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...prev, [activeRole]: { ...prev[activeRole], [module]: updated } };
    });
    setSaved(false);
  };

  const hasAll = (module) => ACTIONS.every(a => perms[activeRole][module]?.includes(a));
  const toggleAll = (module) => {
    setPerms(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [module]: hasAll(module) ? [] : [...ACTIONS],
      },
    }));
    setSaved(false);
  };

  const card     = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const titleCls = dark ? "text-gray-100" : "text-gray-900";
  const subText  = dark ? "text-gray-400" : "text-gray-500";
  const thead    = dark ? "bg-gray-700/60" : "bg-gray-50";
  const thText   = dark ? "text-gray-400" : "text-gray-500";
  const rowHover = dark ? "hover:bg-gray-700/30" : "hover:bg-gray-50";
  const divider  = dark ? "divide-gray-700" : "divide-gray-200";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${titleCls}`}>Permission Management</h2>
        <button
          onClick={() => setSaved(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-[#0f2744] text-white hover:bg-[#1a3a5c] transition-colors">
          {saved ? <><MdCheck size={16} /> Saved</> : "Save Permissions"}
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {ROLES.map(r => (
          <button key={r.key} onClick={() => setActiveRole(r.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              activeRole === r.key
                ? `${r.color} text-white border-transparent shadow-md`
                : dark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}>
            <MdShield size={16} />
            {r.label}
          </button>
        ))}
      </div>

      {/* Permissions Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b ${dark ? "border-gray-700" : "border-gray-200"}`}>
          <p className={`text-sm font-medium ${titleCls}`}>
            Permissions for: <span className="font-bold">{ROLES.find(r => r.key === activeRole)?.label}</span>
          </p>
          <p className={`text-xs mt-0.5 ${subText}`}>Toggle individual permissions or use the checkbox to grant/revoke all actions for a module.</p>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/3 ${thText}`}>Module</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>All</th>
                {ACTIONS.map(a => (
                  <th key={a} className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>{a}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {MODULES.map(module => (
                <tr key={module} className={`transition-colors ${rowHover}`}>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{module}</td>
                  {/* All toggle */}
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => toggleAll(module)}
                      className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${
                        hasAll(module)
                          ? "bg-[#0f2744] text-white"
                          : dark ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-300"
                      }`}>
                      {hasAll(module) && <MdCheck size={14} />}
                    </button>
                  </td>
                  {ACTIONS.map(action => {
                    const has = perms[activeRole][module]?.includes(action);
                    const colors = {
                      View:   has ? "bg-blue-500"   : "",
                      Create: has ? "bg-green-500"  : "",
                      Edit:   has ? "bg-yellow-500" : "",
                      Delete: has ? "bg-red-500"    : "",
                    };
                    return (
                      <td key={action} className="px-4 py-4 text-center">
                        <button onClick={() => toggle(module, action)}
                          className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${
                            has
                              ? `${colors[action]} text-white`
                              : dark ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-300"
                          }`}>
                          {has ? <MdCheck size={14} /> : <MdClose size={12} className={dark ? "text-gray-600" : "text-gray-300"} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
