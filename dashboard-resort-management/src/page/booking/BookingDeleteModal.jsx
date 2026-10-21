import { useState } from "react";
import { Button, message } from "antd";
import { MdClose } from "react-icons/md";
import { request } from "../../util/request";

export default function BookingDeleteModal({ booking, onClose, onDeleted, dark }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const res = await request(`admin/bookings/${booking.id}`, "delete");
    setDeleting(false);
    if (!res?.errors) {
      message.success("Booking deleted");
      onDeleted();
      onClose();
    } else {
      message.error("Failed to delete");
    }
  };

  const modalClass = `rounded-xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`;
  const titleClass = `text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const textClass = `text-sm mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const strongClass = `font-medium ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const codeClass = `font-mono font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const warnClass = `text-xs mb-6 ${dark ? "text-red-400" : "text-red-500"}`;
  const cancelClass = `px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`;
  const deleteClass = "px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={modalClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={titleClass}>Delete Booking</h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <p className={textClass}>
          Are you sure you want to delete booking{" "}
          <span className={codeClass}>{booking.booking_code ?? `BK-${booking.id}`}</span>{" "}
          for <span className={strongClass}>{booking.user?.name ?? "this guest"}</span>?
        </p>
        <p className={warnClass}>This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className={cancelClass}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={deleting} className={deleteClass}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
