import { Button } from "antd";
import { MdEdit, MdDelete, MdReceipt } from "react-icons/md";

/** Row-level edit/delete controls for the booking list. */
export default function BookingStatusActions({ booking, dark, onEdit, onDelete, onFolio }) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      {onFolio && ["confirmed", "checked_in", "checked_out", "completed"].includes(booking.status) && (
        <Button
          onClick={() => onFolio(booking)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-colors ${
            dark ? "bg-teal-900/40 text-teal-300 hover:bg-teal-900/70" : "bg-teal-50 text-teal-700 hover:bg-teal-100"
          }`}
        >
          <MdReceipt size={14} /> Folio
        </Button>
      )}
      <Button
        onClick={() => onEdit(booking)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-colors ${
          dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
        }`}
      >
        <MdEdit size={14} /> Edit
      </Button>
      <Button
        onClick={() => onDelete(booking)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-colors ${
          dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
        }`}
      >
        <MdDelete size={14} /> Delete
      </Button>
    </div>
  );
}
