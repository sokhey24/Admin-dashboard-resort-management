import { useState, useMemo } from "react";
import { MdAdd, MdSearch } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import ButtonDelete from "../../components/layout/Button/ButtonDelete";
import ButtonEdit from "../../components/layout/Button/ButtonEdit";
import { Button } from "antd";

const images = [
  { id: 1, name: "Swimming Pool",    category: "Outdoor",      imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzeaMPwkVax3KT0WjfK89Fy3Brxd4ulCWGep2adVZihGLd56R2-6N-lXJX&s=10",                                                                                   imageAlt: "Swimming Pool",    description: "Olympic-size outdoor swimming pool for adults and children.",                              price: "$120", perTime: "day"     },
  { id: 2, name: "Ocean View Villa", category: "Luxury Suite", imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGp92RuvfG1mzB_5s8FUtbJxLpVi_EejudtjU62ogmD73NpcQeWtoCfZw&s=10",                                                                                  imageAlt: "Ocean View Villa", description: "Wake up to endless blue horizons with private infinity pool and butler service.", price: "$450", perTime: "night"   },
  { id: 3, name: "Garden Terrace",   category: "Outdoor",      imageSrc: "https://q-xx.bstatic.com/xdata/images/hotel/608x352/493354404.webp?k=f45c0e2438e4fb100061fe6d4e23e5772d11e29fb98de46accb85d70e2d82009&o=",                                                             imageAlt: "Garden Terrace",   description: "Lush tropical garden terrace perfect for morning yoga and relaxation.",               price: "$80",  perTime: "session" },
  { id: 4, name: "Spa & Wellness",   category: "Indoor",       imageSrc: "https://symphony.cdn.tambourine.com/reunion-resort/media/reunionresortandgolfcourse-homepage-gallery-01-6487754a47fb6.jpg",                                                                              imageAlt: "Spa",              description: "Full-service spa with massage, sauna, and wellness treatments.",                      price: "$200", perTime: "session" },
  { id: 5, name: "Beach Cabana",     category: "Beach",        imageSrc: "https://content.r9cdn.net/rimg/himg/bb/63/ef/expediav2-35735-78ed85-377987.jpg?crop=true&width=500&height=350",                                                                                          imageAlt: "Beach Cabana",     description: "Private beach cabana with direct ocean access and personal attendant.",               price: "$300", perTime: "day"     },
  { id: 6, name: "Rooftop Bar",      category: "Dining",       imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSD7spPuEIpyL7IJ-AWV-EjbqFgf-Dle_7wRrxzPi_jqPYhGth2hrVGDFw&s=10",                                                                               imageAlt: "Rooftop Bar",      description: "Panoramic rooftop bar with craft cocktails and sunset views.",                       price: "$60",  perTime: "person"  },
  { id: 7, name: "Tennis Court",     category: "Outdoor",      imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH3KA150BdtwWYsHnHe-Ca-MrwXhLAfSY-trZLT9U7CcLJlj-fFyEtA7M&s=10",                                                                               imageAlt: "Tennis Court",     description: "Professional tennis courts available for guests.",                                    price: "$50",  perTime: "hour"    },
  { id: 8, name: "Kids Club",        category: "Indoor",       imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzeaMPwkVax3KT0WjfK89Fy3Brxd4ulCWGep2adVZihGLd56R2-6N-lXJX&s=10",                                                                              imageAlt: "Kids Club",        description: "Supervised play area and activities for children.",                                  price: "$30",  perTime: "day"     },
];

const PAGE_SIZE = 6;

export default function Gallery() {
  const dark = useDarkMode();
  const [search, setSearch] = useState("");
  const [list,   setList]   = useState(images);
  const [page,   setPage]   = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(img =>
      !q || img.name.toLowerCase().includes(q) || img.category.toLowerCase().includes(q)
    );
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = (id) => setList(prev => prev.filter(img => img.id !== id));

  const bg         = dark ? "bg-gray-900"                 : "bg-[#F5F8FC]";
  const titleCls   = dark ? "text-gray-100"               : "text-[#102A43]";
  const subText    = dark ? "text-gray-400"               : "text-[#829AB1]";
  const cardCls    = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const nameCls    = dark ? "text-gray-100"               : "text-stone-950";
  const descCls    = dark ? "text-gray-400"               : "text-stone-600";
  const priceCls   = dark ? "text-gray-100"               : "text-stone-950";
  const perCls     = dark ? "text-[#829AB1]"               : "text-stone-500";
  const dividerCls = dark ? "border-gray-700"             : "border-stone-100";
  const searchCls  = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn    = dark
    ? "px-3 py-1.5 rounded-[10px] border border-gray-600 text-xs font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[10px] border border-[#D9E2EC] text-xs font-medium hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed text-[#486581]";
  const pageNumCls = (isActive) => isActive
    ? "w-8 h-8 rounded-[10px] text-xs font-medium bg-[#FF6B00] text-white"
    : `w-8 h-8 rounded-[10px] text-xs font-medium transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`;

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${bg}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-[26px] font-bold ${titleCls}`}>Gallery</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search…"
              className={searchCls}
            />
          </div>
          <Button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[10px] bg-[#FF6B00] text-white hover:bg-[#e05e00] transition-colors">
            <MdAdd size={14} /> Upload Photo
          </Button>
        </div>
      </div>

      {/* Count badge */}
      <p className={`text-xs mb-4 ${subText}`}>{filtered.length} photo{filtered.length !== 1 ? "s" : ""}</p>

      {/* Cards Grid */}
      {pageItems.length === 0 ? (
        <p className={`text-center py-16 text-sm ${subText}`}>No photos found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pageItems.map(image => (
            <div key={image.id} className={`overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${cardCls}`}>
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={image.imageSrc}
                  alt={image.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase text-stone-800 shadow-sm backdrop-blur-sm">
                  {image.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className={`mb-1 text-base font-bold tracking-tight ${nameCls}`}>{image.name}</h3>
                <p className={`mb-4 text-xs leading-relaxed line-clamp-2 ${descCls}`}>{image.description}</p>

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3 border-t ${dividerCls}`}>
                  <div>
                    <span className={`text-lg font-extrabold ${priceCls}`}>{image.price}</span>
                    <span className={`text-xs font-medium ${perCls}`}> / {image.perTime}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <ButtonEdit dark={dark} />
                    <ButtonDelete dark={dark} onClick={() => handleDelete(image.id)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`mt-6 flex items-center justify-between text-sm ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === "…" ? (
                <span key={`e-${i}`} className="px-2">…</span>
              ) : (
                <Button key={p} onClick={() => setPage(p)} className={pageNumCls(page === p)}>{p}</Button>
              ))}
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      )}

    </div>
  );
}
