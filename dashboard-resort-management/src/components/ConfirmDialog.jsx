import { Button } from "antd";
import { MdClose } from "react-icons/md";

/**
 * ConfirmDialog — reusable Yes/No confirmation modal
 *
 * Props:
 *   open       boolean
 *   title      string
 *   message    string | ReactNode
 *   sub        string | ReactNode  (optional small warning line)
 *   confirmText string  default "Yes"
 *   cancelText  string  default "No"
 *   danger      boolean — red confirm button (default true)
 *   loading     boolean
 *   onConfirm  () => void
 *   onCancel   () => void
 *   dark       boolean
 */
export default function ConfirmDialog({
  open, title, message: msg, sub,
  confirmText = "Yes", cancelText = "No",
  danger = true, loading = false,
  onConfirm, onCancel, dark,
}) {
  if (!open) return null;

  const confirmCls = danger
    ? "px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
    : "px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>{title}</h3>
          <Button onClick={onCancel}><MdClose size={14} /></Button>
        </div>
        <p className={`text-sm mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`}>{msg}</p>
        {sub && <p className={`text-xs mb-4 ${dark ? "text-red-400" : "text-red-500"}`}>{sub}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <Button onClick={onCancel}
            className={`px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={loading} className={confirmCls}>
            {loading ? "Processing…" : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
