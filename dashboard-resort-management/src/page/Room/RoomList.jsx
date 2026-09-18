import { Button } from "antd";
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";
import { RoomStatusBadge } from "./RoomStatus.jsx";
import { primaryRoomImage, roomActionClass, roomImageSrc } from "./roomHelpers";

export default function RoomList({
  rooms,
  dark,
  startIndex = 0,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}) {
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const cellText = dark ? "text-gray-300" : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]" : "text-[#829AB1]";
  const thead = dark ? "bg-gray-700/60" : "bg-[#F5F8FC]";
  const thText = dark ? "text-gray-400" : "text-[#829AB1]";
  const tbody = dark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-100";
  const divider = dark ? "divide-gray-700" : "divide-gray-200";
  const rowHover = dark ? "hover:bg-gray-700/50" : "hover:bg-[#F5F8FC]";

  const columns = [
    "No.",
    "Room Number",
    "Primary Image",
    "Room Type",
    "Resort",
    "Branch",
    "Floor",
    "View",
    "Price/Night",
    "Status",
    "Action",
  ];

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${divider}`}>
        <thead className={thead}>
          <tr>
            {columns.map((h) => (
              <th
                key={h}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${thText} ${h === "No." ? "w-12" : ""} ${h === "Action" ? "text-center" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${tbody} divide-y`}>
          {rooms.map((room, idx) => {
            const primary = primaryRoomImage(room);
            const src = roomImageSrc(primary);
            return (
              <tr key={room.id} className={`transition-colors ${rowHover}`}>
                <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{startIndex + idx + 1}</td>
                <td className={`px-4 py-4 text-sm font-semibold whitespace-nowrap ${titleCls}`}>
                  {room.room_number}
                </td>
                <td className="px-4 py-4">
                  {src ? (
                    <img
                      src={src}
                      alt={`Room ${room.room_number}`}
                      className="w-14 h-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className={`w-14 h-10 rounded-md flex items-center justify-center text-[10px] ${dark ? "bg-gray-700 text-gray-400" : "bg-[#F5F8FC] text-[#829AB1]"}`}>
                      None
                    </div>
                  )}
                </td>
                <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{room.room_type?.name || "—"}</td>
                <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{room.resort?.name || "—"}</td>
                <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{room.branch?.name || "—"}</td>
                <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{room.floor || "—"}</td>
                <td className={`px-4 py-4 text-sm max-w-[140px] truncate ${cellText}`} title={room.view || ""}>
                  {room.view || "—"}
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap font-semibold text-[#FF6B00]">
                  ${Number(room.price_per_night ?? 0).toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <RoomStatusBadge status={room.status} dark={dark} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <Button className={roomActionClass(dark)} onClick={() => onView?.(room)}>
                      <MdVisibility size={14} /> View
                    </Button>
                    {canEdit && (
                      <Button className={roomActionClass(dark)} onClick={() => onEdit?.(room)}>
                        <MdEdit size={14} /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button className={roomActionClass(dark)} onClick={() => onDelete?.(room)}>
                        <MdDelete size={14} /> Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
