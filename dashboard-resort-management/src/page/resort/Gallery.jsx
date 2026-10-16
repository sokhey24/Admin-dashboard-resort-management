import { useEffect, useMemo, useRef, useState } from "react";
import { MdAdd, MdSearch, MdDelete } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
import ConfirmDialog from "../../components/ConfirmDialog";
import { request } from "../../util/request";
import config from "../../util/config";
import useCatalogData from "../../hooks/useCatalogData";
import { asList } from "../../util/asList";

const PAGE_SIZE = 12;

function photoUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = config.image_path.replace(/\/$/, "");
  const clean = path.replace(/^\//, "");
  return `${base}/${clean}`;
}

export default function Gallery() {
  const dark = useDarkMode();
  const { resorts } = useCatalogData({ autoFetch: true });
  const fileRef = useRef(null);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [uploadResortId, setUploadResortId] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    request("admin/gallery", "get")
      .then((res) => {
        setList(asList(res?.data ?? res));
        setLoading(false);
      })
      .catch(() => {
        setList([]);
        setLoadError("Could not load gallery from the server.");
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!uploadResortId && resorts.length) {
      setUploadResortId(String(resorts[0].id));
    }
  }, [resorts, uploadResortId]);

  const resortName = (id) => resorts.find((r) => Number(r.id) === Number(id))?.name ?? "Resort";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((img) => {
      if (!q) return true;
      const title = img.title ?? "";
      const caption = img.caption ?? "";
      return (
        title.toLowerCase().includes(q) ||
        caption.toLowerCase().includes(q) ||
        resortName(img.resort_id).toLowerCase().includes(q)
      );
    });
  }, [list, search, resorts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadResortId) return;
    setUploading(true);
    const form = new FormData();
    form.append("photo", file);
    form.append("resort_id", uploadResortId);
    const res = await request("admin/gallery", "post", form);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res?.errors) load();
  };

  const handleDelete = async () => {
    if (!confirm) return;
    const res = await request(`admin/gallery/${confirm.image.id}`, "delete");
    if (!res?.errors) load();
    setConfirm(null);
  };

  const bg = dark ? "bg-gray-900" : "bg-[#F5F8FC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const cardCls = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn = dark
    ? "px-3 py-1.5 rounded-[10px] border border-gray-600 text-xs font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[10px] border border-[#D9E2EC] text-xs font-medium hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed text-[#486581]";
  const pageNumCls = (isActive) =>
    isActive
      ? "w-8 h-8 rounded-[10px] text-xs font-medium bg-[#FF6B00] text-white"
      : `w-8 h-8 rounded-[10px] text-xs font-medium transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`;
  const actionBtn = `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
    dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
  }`;

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${bg}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className={`text-[26px] font-bold ${titleCls}`}>Gallery</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={uploadResortId}
            onChange={(e) => setUploadResortId(e.target.value)}
            className={`text-sm rounded-[10px] border px-2 py-1.5 ${dark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-[#D9E2EC]"}`}
          >
            {resorts.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button
            disabled={uploading || !uploadResortId}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[10px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60"
          >
            <MdAdd size={14} /> {uploading ? "Uploading…" : "Upload Photo"}
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{loadError}</span>
          <Button onClick={load} className="text-red-700 font-medium">Retry</Button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search…"
            className={searchCls}
          />
        </div>
        <p className={`text-xs ${subText}`}>
          {loading ? "Loading…" : `${filtered.length} photo${filtered.length !== 1 ? "s" : ""} (resort_api)`}
        </p>
      </div>

      {loading ? (
        <p className={`text-center py-16 text-sm ${subText}`}>Loading gallery…</p>
      ) : pageItems.length === 0 ? (
        <p className={`text-center py-16 text-sm ${subText}`}>No photos yet. Upload to store in MySQL and public storage.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pageItems.map((image) => (
            <div key={image.id} className={`overflow-hidden rounded-xl border shadow-sm ${cardCls}`}>
              <div className="relative h-48 overflow-hidden bg-stone-100">
                <img
                  src={photoUrl(image.path)}
                  alt={image.title || `Photo ${image.id}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-stone-800 shadow-sm">
                  {resortName(image.resort_id)}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${titleCls}`}>{image.title || `Photo #${image.id}`}</p>
                  {image.caption && <p className={`text-xs truncate ${subText}`}>{image.caption}</p>}
                </div>
                <Button onClick={() => setConfirm({ image })} className={actionBtn}>
                  <MdDelete size={14} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={`mt-6 flex items-center justify-between text-sm ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p) => (
                <Button key={p} onClick={() => setPage(p)} className={pageNumCls(page === p)}>{p}</Button>
              ))}
            <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        dark={dark}
        title="Delete Photo"
        message={confirm ? "Remove this photo from the gallery?" : ""}
        sub="Deletes the database row and storage file reference."
        confirmText="Yes, Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
