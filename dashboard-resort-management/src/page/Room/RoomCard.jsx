import { useState } from "react";
import { MdSearch, MdAdd } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";

export const ROOM_TYPES = [
  {
    id: 1, title: "Superior Room",  roomNumber: "101", floor: 1,
    desc: "Superior Room, 1 King Bed (1.5m)", price: "$100", status: "available",
    size: "28 m²", capacity: 2, beds: "1 King Bed",
    amenities: ["Free Wi-Fi", "Air Conditioning", "Flat-screen TV", "Mini Bar", "Safe Box"],
    imageRoom: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2, title: "Deluxe Room",    roomNumber: "205", floor: 2,
    desc: "Deluxe Room, 2 Queen Beds", price: "$150", status: "occupied",
    size: "35 m²", capacity: 4, beds: "2 Queen Beds",
    amenities: ["Free Wi-Fi", "Air Conditioning", "Flat-screen TV", "Mini Bar", "Bathtub", "City View"],
    imageRoom: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3, title: "Suite Room",     roomNumber: "308", floor: 3,
    desc: "Suite Room, 1 King Bed with Living Area", price: "$250", status: "available",
    size: "55 m²", capacity: 2, beds: "1 King Bed",
    amenities: ["Free Wi-Fi", "Air Conditioning", "Flat-screen TV", "Mini Bar", "Jacuzzi", "Living Room", "Ocean View"],
    imageRoom: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4, title: "Villa",          roomNumber: "V02", floor: 1,
    desc: "Private Villa with Pool", price: "$500", status: "maintenance",
    size: "120 m²", capacity: 6, beds: "2 King Beds",
    amenities: ["Free Wi-Fi", "Private Pool", "Air Conditioning", "Full Kitchen", "BBQ Area", "Garden", "Butler Service"],
    imageRoom: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5, title: "Standard Room",  roomNumber: "110", floor: 1,
    desc: "Standard Room, 1 Double Bed", price: "$80", status: "available",
    size: "22 m²", capacity: 2, beds: "1 Double Bed",
    amenities: ["Free Wi-Fi", "Air Conditioning", "Flat-screen TV"],
    imageRoom: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
  },
];

const STATUSES = ["all", "available", "occupied", "maintenance"];

const STATUS_STYLE = {
  available:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  occupied:    { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",          dark: "bg-red-900/40 text-red-400 ring-red-700"         },
  maintenance: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.maintenance;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function RoomCard({ selectedId, onSelect }) {
  const dark = useDarkMode();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = ROOM_TYPES.filter((r) =>
    (status === "all" || r.status === status) &&
    (!search || r.title.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr   = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText   = dark ? "text-gray-400"                 : "text-[#486581]";
  const filterBg  = dark ? "bg-gray-700"                   : "bg-[#F5F8FC]";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48 placeholder:text-[#829AB1]";

  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden mb-6 ${card}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[18px] font-bold ${titleCls}`}>Room Types</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${
            dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FFF3E8] text-[#FF6B00] ring-[#FFD4A8]"
          }`}>
            {filtered.length} rooms
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className={`flex gap-1 rounded-lg p-1 ${filterBg}`}>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  status === s
                    ? dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow"
                    : dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]"
                }`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…" className={searchCls} />
          </div>
          {/* Add Room */}
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] transition-colors">
            <MdAdd size={14} /> Add Room
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="p-6">
        {filtered.length === 0 ? (
          <p className={`text-center text-sm py-10 ${subText}`}>No rooms found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect?.(item)}
                className={`rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 ${
                  selectedId === item.id
                    ? dark ? "border-[#FF6B00] ring-2 ring-[#FF6B00]/30" : "border-[#FF6B00] ring-2 ring-[#FF6B00]/20"
                    : card
                } ${dark ? "bg-gray-800 hover:bg-gray-700/60" : "bg-white hover:bg-[#F5F8FC]"}`}>
                <img src={item.imageRoom} alt={item.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold text-sm ${titleCls}`}>{item.title}</span>
                    <BadgeWithDot status={item.status} dark={dark} />
                  </div>
                  <p className={`text-xs mb-1 ${subText}`}>Room No: {item.roomNumber}</p>
                  <p className={`text-xs mb-3 ${subText}`}>{item.desc}</p>
                  <p className={`text-sm font-bold ${dark ? "text-[#FF6B00]" : "text-[#FF6B00]"}`}>{item.price}/night</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
