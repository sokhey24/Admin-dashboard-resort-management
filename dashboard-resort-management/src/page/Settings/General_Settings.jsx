import { useState } from "react";
import { MdSave, MdBusiness, MdLanguage, MdPalette, MdSecurity } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { message } from "antd";
import { Button } from "antd/es/radio";

export default function General_Settings() {
  const dark = useDarkMode();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    resort_name:    "Resort Management System",
    resort_email:   "info@resort.com",
    resort_phone:   "+855 12 345 678",
    resort_address: "Siem Reap, Cambodia",
    currency:       "USD",
    timezone:       "Asia/Phnom_Penh",
    language:       "en",
    date_format:    "YYYY-MM-DD",
    check_in_time:  "14:00",
    check_out_time: "12:00",
    tax_rate:       "10",
    session_timeout: "60",
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    message.success("Settings saved successfully!");
  };

  const card     = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const titleCls = dark ? "text-gray-100" : "text-gray-900";
  const subText  = dark ? "text-gray-400" : "text-gray-500";
  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/40 ${
    dark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
  }`;
  const labelCls = `block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`;
  const sectionHdr = `flex items-center gap-2 text-sm font-semibold mb-4 pb-2 border-b ${dark ? "text-gray-200 border-gray-700" : "text-gray-800 border-gray-200"}`;

  const field = (label, key, type = "text", options = null) => (
    <div>
      <label className={labelCls}>{label}</label>
      {options ? (
        <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls} />
      )}
    </div>
  );

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${titleCls}`}>General Settings</h2>
        <Button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-[#0f2744] text-white hover:bg-[#1a3a5c] disabled:opacity-60 transition-colors">
          <MdSave size={16} /> {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Resort Info */}
        <div className={`rounded-2xl border shadow-sm p-5 ${card}`}>
          <div className={sectionHdr}>
            <MdBusiness size={18} className={dark ? "text-blue-400" : "text-[#0f2744]"} />
            Resort Information
          </div>
          <div className="space-y-4">
            {field("Resort Name",    "resort_name")}
            {field("Contact Email",  "resort_email",   "email")}
            {field("Contact Phone",  "resort_phone")}
            {field("Address",        "resort_address")}
          </div>
        </div>

        {/* Localization */}
        <div className={`rounded-2xl border shadow-sm p-5 ${card}`}>
          <div className={sectionHdr}>
            <MdLanguage size={18} className={dark ? "text-green-400" : "text-green-600"} />
            Localization
          </div>
          <div className="space-y-4">
            {field("Currency", "currency", "text", [
              { value: "USD", label: "USD — US Dollar" },
              { value: "KHR", label: "KHR — Cambodian Riel" },
              { value: "EUR", label: "EUR — Euro" },
            ])}
            {field("Timezone", "timezone", "text", [
              { value: "Asia/Phnom_Penh", label: "Asia/Phnom_Penh (UTC+7)" },
              { value: "Asia/Bangkok",    label: "Asia/Bangkok (UTC+7)" },
              { value: "UTC",             label: "UTC" },
            ])}
            {field("Language", "language", "text", [
              { value: "en", label: "English" },
              { value: "km", label: "Khmer" },
            ])}
            {field("Date Format", "date_format", "text", [
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
            ])}
          </div>
        </div>

        {/* Booking */}
        <div className={`rounded-2xl border shadow-sm p-5 ${card}`}>
          <div className={sectionHdr}>
            <MdPalette size={18} className={dark ? "text-purple-400" : "text-purple-600"} />
            Booking Defaults
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field("Check-in Time",  "check_in_time",  "time")}
              {field("Check-out Time", "check_out_time", "time")}
            </div>
            {field("Tax Rate (%)", "tax_rate", "number")}
          </div>
        </div>

        {/* Security */}
        <div className={`rounded-2xl border shadow-sm p-5 ${card}`}>
          <div className={sectionHdr}>
            <MdSecurity size={18} className={dark ? "text-red-400" : "text-red-600"} />
            Security
          </div>
          <div className="space-y-4">
            {field("Session Timeout (minutes)", "session_timeout", "number")}
            <div className={`rounded-lg p-3 text-xs ${dark ? "bg-gray-700/60 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
              Sessions will automatically expire after the specified number of minutes of inactivity.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
