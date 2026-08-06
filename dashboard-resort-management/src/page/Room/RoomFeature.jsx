import { MdClose, MdEdit, MdDelete, MdPeople, MdSquareFoot, MdHotel, MdLayers, MdCheckCircle } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";

const STATUS_STYLE = {
  available:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  occupied:    { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",          dark: "bg-red-900/40 text-red-400 ring-red-700"         },
  maintenance: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.maintenance;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function RoomFeature({ room, onClose }) {
  const dark = useDarkMode();

  const card     = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const titleCls = dark ? "text-gray-100"               : "text-gray-900";
  const subText  = dark ? "text-gray-400"               : "text-gray-500";
  const divider  = dark ? "border-gray-700"             : "border-gray-100";
  const metaBg   = dark ? "bg-gray-700/60"              : "bg-gray-50";
  const metaText = dark ? "text-gray-300"               : "text-gray-700";

  const stats = [
    { icon: <MdSquareFoot size={18} />, label: "Room Size", value: room.size              },
    { icon: <MdPeople     size={18} />, label: "Capacity",  value: `${room.capacity} guests` },
    { icon: <MdHotel      size={18} />, label: "Bed Type",  value: room.beds              },
    { icon: <MdLayers     size={18} />, label: "Floor",     value: `Floor ${room.floor}`  },
  ];

  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden ${card}`}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img src={room.imageRoom} alt={room.title} className="w-full h-full object-cover" />
        <Button
          type="text"
          shape="circle"
          size="small"
          icon={<MdClose size={16} />}
          onClick={onClose}
          className="!absolute top-3 right-3 !bg-black/50 hover:!bg-black/70 !text-white !border-0"
        />
        <div className="absolute bottom-3 left-3">
          <BadgeWithDot status={room.status} dark={dark} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title + Room No */}
        <div className="mb-4">
          <h3 className={`text-lg font-bold mb-0.5 ${titleCls}`}>{room.title}</h3>
          <p className={`text-xs ${subText}`}>Room No: {room.roomNumber}</p>
        </div>

        {/* Price */}
        <div className={`flex items-baseline gap-1 mb-4 pb-4 border-b ${divider}`}>
          <span className={`text-2xl font-extrabold ${dark ? "text-blue-400" : "text-[#0f2744]"}`}>{room.price}</span>
          <span className={`text-xs ${subText}`}>/ night</span>
        </div>

        {/* Stats grid */}
        <div className={`grid grid-cols-2 gap-2 mb-4 pb-4 border-b ${divider}`}>
          {stats.map((s) => (
            <div key={s.label} className={`rounded-lg p-3 flex flex-col gap-1 ${metaBg}`}>
              <span className={dark ? "text-gray-400" : "text-gray-400"}>{s.icon}</span>
              <span className={`text-[10px] uppercase tracking-wide ${subText}`}>{s.label}</span>
              <span className={`text-xs font-semibold ${metaText}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className={`mb-4 pb-4 border-b ${divider}`}>
          <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${subText}`}>Description</p>
          <p className={`text-sm leading-relaxed ${dark ? "text-gray-300" : "text-gray-600"}`}>{room.desc}</p>
        </div>

        {/* Amenities */}
        <div className="mb-5">
          <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${subText}`}>Amenities</p>
          <div className="flex flex-wrap gap-1.5">
            {room.amenities?.map((a) => (
              <span key={a} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                dark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
              }`}>
                <MdCheckCircle size={11} className={dark ? "text-green-400" : "text-green-500"} />
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<MdEdit size={14} />}
            className="flex-1"
            ghost={dark}>
            Edit Room
          </Button>
          <Button
            danger
            icon={<MdDelete size={14} />}
            className="flex-1"
            type={dark ? "default" : "default"}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
