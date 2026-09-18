import { MdClose, MdEdit, MdDelete, MdPeople, MdSquareFoot, MdHotel, MdLayers, MdCheckCircle, MdImage } from "react-icons/md";
import { Button } from "antd";
import { useDarkMode } from "../../util/DarkModeContext";
import { RoomStatusBadge } from "./RoomStatus.jsx";
import { primaryRoomImage, roomActionClass, roomFeatures, roomImageSrc, roomTypeAmenities } from "./roomHelpers";

export default function RoomFeatureChips({ room, compact = false }) {
  const dark = useDarkMode();
  return <AmenityChips names={roomFeatures(room)} compact={compact} dark={dark} />;
}

export function RoomTypeAmenityChips({ type, facilities = [], compact = false }) {
  const dark = useDarkMode();
  return <AmenityChips names={roomTypeAmenities(type, facilities)} compact={compact} dark={dark} />;
}

function AmenityChips({ names, compact, dark }) {
  if (!names.length) {
    return <p className={`text-xs ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>No amenities listed</p>;
  }
  const shown = compact ? names.slice(0, 4) : names;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((name) => (
        <span
          key={name}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
            compact ? "text-[10px]" : "text-xs"
          } ${dark ? "bg-gray-700 text-gray-200" : "bg-[#F5F8FC] text-[#102A43]"}`}
        >
          {!compact && <MdCheckCircle size={14} className={dark ? "text-green-400" : "text-green-500"} />}
          {name}
        </span>
      ))}
      {compact && names.length > 4 && (
        <span className={`text-[10px] ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>+{names.length - 4}</span>
      )}
    </div>
  );
}

export function RoomFeaturePanel({ room, onClose, onEdit, onDelete, canEdit, canDelete }) {
  const dark = useDarkMode();
  if (!room) return null;

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const bodyText = dark ? "text-gray-200" : "text-[#102A43]";
  const divider = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const metaBg = dark ? "bg-gray-700/50 border-gray-600" : "bg-[#F5F8FC] border-[#D9E2EC]";
  const emptyImg = dark ? "bg-gray-700 text-gray-400" : "bg-[#F5F8FC] text-[#829AB1]";
  const images = Array.isArray(room.images) ? room.images : [];
  const primary = primaryRoomImage(room);
  const image = roomImageSrc(primary);
  const extraImages = images.filter((img) => img.id !== primary?.id);
  const features = roomFeatures(room);
  const type = room.room_type ?? {};
  const location = [room.resort?.name, room.branch?.name].filter(Boolean).join(" • ") || "—";
  const description = room.notes || type.description || "No description provided.";

  const stats = [
    { icon: <MdSquareFoot size={18} aria-hidden />, label: "Room Size", value: type.size_sqm ? `${type.size_sqm} m²` : "—" },
    { icon: <MdPeople size={18} aria-hidden />, label: "Capacity", value: type.max_occupancy != null ? `${type.max_occupancy} guests` : "—" },
    { icon: <MdHotel size={18} aria-hidden />, label: "Bed Type", value: type.bed_type || "—" },
    { icon: <MdLayers size={18} aria-hidden />, label: "Floor", value: room.floor ? `Floor ${room.floor}` : "—" },
  ];

  const actionFocus = "focus-visible:!ring-2 focus-visible:!ring-[#FF6B00]/50 focus-visible:!ring-offset-1 min-h-9 px-3";

  return (
    <article className={`rounded-2xl shadow-sm border overflow-hidden transition ${card}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className="relative h-52 sm:h-56 overflow-hidden">
        {image ? (
          <img src={image} alt={`Room ${room.room_number}`} className="w-full h-full object-cover" />
        ) : (
          <div className={`h-full flex flex-col items-center justify-center gap-2 ${emptyImg}`}>
            <MdImage size={36} aria-hidden />
            <span className="text-sm font-medium">No room image</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <Button
          type="text"
          shape="circle"
          aria-label="Close room details"
          icon={<MdClose size={16} />}
          onClick={onClose}
          className="!absolute top-3 right-3 z-10 !bg-black/55 hover:!bg-black/75 !text-white !border-0 !shadow-sm focus-visible:!ring-2 focus-visible:!ring-white"
        />
        <div className="absolute bottom-3 left-3 z-10">
          <RoomStatusBadge status={room.status} dark={dark} />
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <header className="mb-4">
          <h3 className={`text-xl sm:text-2xl font-bold leading-tight mb-1 ${titleCls}`}>{type.name || "Room"}</h3>
          <p className={`text-sm font-medium ${subText}`}>Room No. {room.room_number}</p>
          <p className={`text-xs mt-1.5 ${subText}`}>{location}</p>
        </header>

        <div className={`mb-4 pb-4 border-b ${divider}`}>
          <p className={`text-2xl sm:text-3xl font-extrabold leading-none tracking-tight ${titleCls}`}>
            ${Number(room.price_per_night ?? 0).toFixed(2)}
          </p>
          <p className={`text-xs mt-1.5 uppercase tracking-wide ${subText}`}>per night</p>
        </div>

        <div className={`grid grid-cols-2 gap-2.5 mb-4 pb-4 border-b ${divider}`}>
          {stats.map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 flex items-start gap-2.5 min-w-0 ${metaBg}`}>
              <span className={`mt-0.5 shrink-0 ${subText}`}>{s.icon}</span>
              <div className="min-w-0">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${subText}`}>{s.label}</p>
                <p className={`text-sm font-semibold truncate ${bodyText}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {extraImages.length > 0 && (
          <section className={`mb-4 pb-4 border-b ${divider}`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2.5 ${subText}`}>Additional images</h4>
            <div className="grid grid-cols-3 gap-2">
              {extraImages.map((img) => {
                const src = roomImageSrc(img);
                return src ? (
                  <img
                    key={img.id}
                    src={src}
                    alt={`Room ${room.room_number} additional photo`}
                    className={`aspect-[4/3] w-full rounded-lg object-cover border transition hover:opacity-90 ${dark ? "border-gray-600" : "border-[#D9E2EC]"}`}
                  />
                ) : null;
              })}
            </div>
          </section>
        )}

        <section className={`mb-4 pb-4 border-b ${divider}`}>
          <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${subText}`}>Description</h4>
          <div className={`h-px mb-2.5 ${dark ? "bg-gray-700" : "bg-[#D9E2EC]"}`} />
          <p className={`text-sm leading-relaxed max-h-32 overflow-y-auto pr-1 ${bodyText}`}>
            {description}
          </p>
        </section>

        <section className="mb-5">
          <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2.5 ${subText}`}>Amenities</h4>
          <AmenityChips names={features} compact={false} dark={dark} />
        </section>

        {(canEdit || canDelete) && (
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button className={`${roomActionClass(dark)} ${actionFocus} min-w-[96px] justify-center`} onClick={() => onEdit?.(room)}>
                <MdEdit size={16} aria-hidden /> Edit
              </Button>
            )}
            {canDelete && (
              <Button className={`${roomActionClass(dark)} ${actionFocus} min-w-[96px] justify-center`} onClick={() => onDelete?.(room)}>
                <MdDelete size={16} aria-hidden /> Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
