import { useState } from "react";
import { MdSave, MdNotifications, MdEmail, MdSms } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { message } from "antd";
import { Button } from "antd/es/radio";
const NOTIFICATION_GROUPS = [
  {
    group: "Booking Notifications",
    icon: <MdNotifications size={18} />,
    color: "text-blue-500",
    items: [
      { key: "new_booking",       label: "New Booking",        desc: "When a new booking is created" },
      { key: "booking_confirmed", label: "Booking Confirmed",  desc: "When a booking is confirmed" },
      { key: "booking_cancelled", label: "Booking Cancelled",  desc: "When a booking is cancelled" },
      { key: "checkin_reminder",  label: "Check-in Reminder",  desc: "24 hours before guest check-in" },
      { key: "checkout_reminder", label: "Check-out Reminder", desc: "Morning of guest check-out" },
    ],
  },
  {
    group: "Restaurant Notifications",
    icon: <MdEmail size={18} />,
    color: "text-orange-500",
    items: [
      { key: "new_order",         label: "New Food Order",     desc: "When a new food order is placed" },
      { key: "table_reservation", label: "Table Reservation",  desc: "When a table is reserved" },
      { key: "order_completed",   label: "Order Completed",    desc: "When an order is marked complete" },
    ],
  },
  {
    group: "System Notifications",
    icon: <MdSms size={18} />,
    color: "text-purple-500",
    items: [
      { key: "maintenance_alert", label: "Maintenance Alert",  desc: "When a room needs maintenance" },
      { key: "payment_received",  label: "Payment Received",   desc: "When a payment is processed" },
      { key: "low_inventory",     label: "Low Inventory",      desc: "When restaurant inventory is low" },
      { key: "system_update",     label: "System Update",      desc: "When a system update is available" },
    ],
  },
];

function Toggle({ checked, onChange, dark }) {
  return (
    <Button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-[#0f2744]" : dark ? "bg-gray-600" : "bg-gray-300"
      }`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-4" : "translate-x-1"
      }`} />
    </Button>
  );
}

export default function Notification() {
  const dark = useDarkMode();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(() => {
    const init = {};
    NOTIFICATION_GROUPS.forEach(g => g.items.forEach(item => {
      init[item.key] = { email: true, push: true };
    }));
    return init;
  });

  const toggle = (key, channel) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    message.success("Notification settings saved!");
  };

  const card     = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const titleCls = dark ? "text-gray-100" : "text-gray-900";
  const subText  = dark ? "text-gray-400" : "text-gray-500";
  const rowHover = dark ? "hover:bg-gray-700/30" : "hover:bg-gray-50";
  const divider  = dark ? "divide-gray-700" : "divide-gray-100";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${titleCls}`}>Notification Settings</h2>
        <Button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-[#0f2744] text-white hover:bg-[#1a3a5c] disabled:opacity-60 transition-colors">
          <MdSave size={16} /> {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>

      <div className="space-y-5">
        {NOTIFICATION_GROUPS.map(group => (
          <div key={group.group} className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
            {/* Group Header */}
            <div className={`px-6 py-4 border-b flex items-center gap-2 ${dark ? "border-gray-700" : "border-gray-200"}`}>
              <span className={group.color}>{group.icon}</span>
              <span className={`text-sm font-semibold ${titleCls}`}>{group.group}</span>
            </div>

            {/* Column Headers */}
            <div className={`px-6 py-2 grid grid-cols-[1fr_80px_80px] gap-4 border-b ${dark ? "border-gray-700 bg-gray-700/40" : "border-gray-100 bg-gray-50"}`}>
              <span className={`text-xs font-medium uppercase tracking-wider ${subText}`}>Notification</span>
              <span className={`text-xs font-medium uppercase tracking-wider text-center ${subText}`}>Email</span>
              <span className={`text-xs font-medium uppercase tracking-wider text-center ${subText}`}>Push</span>
            </div>

            {/* Items */}
            <div className={`divide-y ${divider}`}>
              {group.items.map(item => (
                <div key={item.key} className={`px-6 py-3 grid grid-cols-[1fr_80px_80px] gap-4 items-center transition-colors ${rowHover}`}>
                  <div>
                    <p className={`text-sm font-medium ${titleCls}`}>{item.label}</p>
                    <p className={`text-xs ${subText}`}>{item.desc}</p>
                  </div>
                  <div className="flex justify-center">
                    <Toggle checked={settings[item.key]?.email} onChange={() => toggle(item.key, "email")} dark={dark} />
                  </div>
                  <div className="flex justify-center">
                    <Toggle checked={settings[item.key]?.push} onChange={() => toggle(item.key, "push")} dark={dark} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
