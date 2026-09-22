import { MdPeople, MdAttachMoney, MdEdit, MdVisibility, MdDelete } from "react-icons/md";
import { Button } from "antd";
import { useDarkMode } from "../../util/DarkModeContext";
import { RoomStatusBadge } from "./RoomStatus.jsx";
import RoomFeatureChips from "./RoomFeature.jsx";
import { PriceWithDiscount } from "./RoomPrice.jsx";
import { effectiveDiscountPercent, primaryRoomImage, roomActionClass, roomImageSrc } from "./roomHelpers";
import ReviewRating from "./reviews/ReviewRating";

export default function RoomCard({
  room,
  reviews = [],
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
  const dark = useDarkMode();
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const bodyText = dark ? "text-gray-300" : "text-[#486581]";
  const card = dark ? "bg-gray-800 border-gray-700 hover:bg-gray-700/40" : "bg-white border-[#D9E2EC] hover:bg-[#F5F8FC]";
  const image = roomImageSrc(primaryRoomImage(room));
  const typeName = room.room_type?.name || "Room";
  const capacity = room.room_type?.max_occupancy;
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <article className={`rounded-xl border overflow-hidden flex flex-col transition-colors duration-200 ${card}`}>
      {image ? (
        <img src={image} alt={`Room ${room.room_number}`} className="w-full h-40 object-cover" />
      ) : (
        <div className={`h-40 flex items-center justify-center text-sm ${dark ? "bg-gray-700 text-gray-400" : "bg-[#F5F8FC] text-[#829AB1]"}`}>
          No image
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h3 className={`font-semibold text-sm truncate ${titleCls}`}>Room {room.room_number}</h3>
            <p className={`text-xs truncate ${subText}`}>{typeName}</p>
          </div>
          <RoomStatusBadge status={room.status} dark={dark} />
        </div>
        <p className={`text-xs mb-2 ${subText}`}>
          {[room.branch?.name, room.resort?.name].filter(Boolean).join(" • ") || "—"}
        </p>
        <div className={`flex items-center gap-3 text-xs mb-3 ${bodyText}`}>
          <span className="inline-flex items-center gap-1">
            <MdPeople size={14} /> {capacity != null ? `${capacity} guests` : "—"}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#FF6B00]">
            <MdAttachMoney size={14} />
            <PriceWithDiscount
              price={room.price_per_night}
              percent={room.effective_discount_percent ?? effectiveDiscountPercent(room)}
              dark={dark}
              suffix="/night"
            />
          </span>
        </div>
        <RoomFeatureChips room={room} compact />

        <div className={`mt-3 pt-3 border-t ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <ReviewRating value={avgRating} size={16} />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
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
      </div>
    </article>
  );
}
