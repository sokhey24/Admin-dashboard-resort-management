import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Form, Input, InputNumber, Modal, Select, Spin, message } from "antd";
import { MdAdd, MdDelete, MdEdit, MdSearch, MdVisibility } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import usePermission from "../../util/usePermission";
import useRole from "../../util/useRole";
import ConfirmDialog from "../../components/ConfirmDialog";
import { RoomTypeAmenityChips } from "./RoomFeature.jsx";
import { DiscountPreview, PriceWithDiscount } from "./RoomPrice.jsx";
import ReviewPagination from "./reviews/ReviewPagination";
import {
  MAX_DISCOUNT_PERCENT,
  TYPE_STATUSES,
  TYPE_STATUS_STYLE,
  applyFormErrors,
  asList,
  formatPercent,
  GUEST_AMENITY_PRESETS,
  paginationFrom,
  roomActionClass,
} from "./roomHelpers";

function TypeStatusBadge({ status, dark }) {
  const s = TYPE_STATUS_STYLE[status] ?? TYPE_STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 capitalize ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status || "Unknown"}
    </span>
  );
}

export default function RoomTypes() {
  const dark = useDarkMode();
  const { canAny } = usePermission();
  const { isAdmin } = useRole();
  const canCreate = isAdmin || canAny("admin.resorts.create", "resort.rooms.create");
  const canEdit = isAdmin || canAny("admin.resorts.update", "resort.rooms.update");
  const canDelete = isAdmin || canAny("admin.resorts.delete", "resort.rooms.delete");

  const [types, setTypes] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, rooms: 0, avg_price: 0 });
  const [meta, setMeta] = useState({ current: 1, last: 1, perPage: 10, total: 0, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState();
  const [resortId, setResortId] = useState();
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resorts, setResorts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [form] = Form.useForm();
  const basePriceWatch = Form.useWatch("base_price", form);
  const discountWatch = Form.useWatch("discount_percent", form);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    params.set("sort", sort);
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (resortId) params.set("resort_id", String(resortId));
    return params.toString();
  }, [page, perPage, search, status, sort, resortId]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return request(`admin/room-types?${query}`, "get").then((res) => {
      if (res?.errors) {
        setTypes([]);
        setError(res.errors.message ?? "Unable to load room types.");
      } else {
        setTypes(asList(res));
        setMeta(paginationFrom(res));
        if (res?.stats) setStats(res.stats);
      }
      setLoading(false);
    });
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    load().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [load]);

  useEffect(() => {
    request("admin/resorts", "get").then((res) => { if (!res?.errors) setResorts(asList(res)); });
    request("admin/facilities", "get").then((res) => { if (!res?.errors) setFacilities(asList(res)); });
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: "active",
      max_occupancy: 2,
      bed_count: 1,
      discount_percent: 0,
      amenities: [],
      breakfast_included: false,
      free_cancellation: true,
    });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({
      resort_id: row.resort_id,
      name: row.name,
      description: row.description,
      base_price: row.base_price != null ? Number(row.base_price) : undefined,
      discount_percent: row.discount_percent != null ? Number(row.discount_percent) : 0,
      max_occupancy: row.max_occupancy,
      bed_count: row.bed_count,
      bed_type: row.bed_type,
      size_sqm: row.size_sqm != null ? Number(row.size_sqm) : undefined,
      status: row.status || "active",
      amenities: Array.isArray(row.amenities) ? row.amenities : [],
      breakfast_included: !!row.breakfast_included,
      free_cancellation: row.free_cancellation !== false,
    });
    setFormOpen(true);
  };

  const saveType = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      amenities: Array.isArray(values.amenities) ? values.amenities.filter(Boolean) : [],
      breakfast_included: values.breakfast_included === true,
      free_cancellation: values.free_cancellation !== false,
    };
    setSaving(true);
    const res = await request(editing ? `admin/room-types/${editing.id}` : "admin/room-types", editing ? "put" : "post", payload);
    setSaving(false);
    if (res?.errors) {
      applyFormErrors(form, res.errors);
      message.error(res.errors.message ?? "Unable to save room type.");
      return;
    }
    message.success(editing ? "Room type updated" : "Room type created");
    setFormOpen(false);
    load();
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    const res = await request(`admin/room-types/${confirm.row.id}`, "delete");
    setConfirmBusy(false);
    if (res?.errors) {
      message.error(res.errors.message ?? "Unable to delete room type.");
      return;
    }
    message.success("Room type deleted");
    setConfirm(null);
    load();
  };

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const cellText = dark ? "text-gray-300" : "text-[#486581]";
  const thead = dark ? "bg-gray-700/60" : "bg-[#F5F8FC]";
  const thText = dark ? "text-gray-400" : "text-[#829AB1]";
  const tbody = dark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-100";
  const divider = dark ? "divide-gray-700" : "divide-gray-200";
  const hasFilters = Boolean(searchInput || status || resortId);

  return (
    <div className={`min-h-full rounded-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className={`text-[26px] font-bold ${titleCls}`}>Room Type Management</h2>
          <p className={`text-sm mt-1 ${subText}`}>Manage room categories, pricing, capacity, and amenities.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} allowClear prefix={<MdSearch />} placeholder="Search room type..." className="min-w-[200px]" />
          <Select allowClear placeholder="Status" className="min-w-[120px]" value={status} options={TYPE_STATUSES.map((s) => ({ value: s, label: s }))} onChange={(v) => { setStatus(v); setPage(1); }} />
          <Select allowClear showSearch optionFilterProp="label" placeholder="Resort" className="min-w-[150px]" value={resortId}
            options={resorts.map((r) => ({ value: r.id, label: r.name }))}
            onChange={(v) => { setResortId(v); setPage(1); }} />
          <Select className="min-w-[140px]" value={sort} options={[{ value: "name", label: "Name" }, { value: "base_price", label: "Price" }, { value: "max_occupancy", label: "Capacity" }]} onChange={(v) => { setSort(v); setPage(1); }} />
          {hasFilters && <Button type="link" onClick={() => { setSearchInput(""); setSearch(""); setStatus(undefined); setResortId(undefined); setPage(1); }}>Reset</Button>}
          {canCreate && <Button type="primary" icon={<MdAdd />} className="!bg-[#FF6B00] !border-[#FF6B00]" onClick={openCreate}>Add Room Type</Button>}
        </div>
      </div>

      <div className={`rounded-xl border p-4 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3 ${card}`}>
        {[
          { label: "Total Types", value: stats.total, color: "#1677ff" },
          { label: "Active Types", value: stats.active, color: "#52c41a" },
          { label: "Rooms", value: stats.rooms, color: "#FF6B00" },
          { label: "Avg. Price", value: `$${Number(stats.avg_price || 0).toFixed(0)}`, color: "#722ed1" },
        ].map((s) => (
          <div key={s.label}>
            <p className={`text-[11px] font-semibold uppercase ${subText}`}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex justify-between">
          <span>{error}</span>
          <Button size="small" onClick={load}>Retry</Button>
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden ${card}`}>
        {loading ? (
          <div className="py-20 flex justify-center"><Spin /></div>
        ) : types.length === 0 ? (
          <div className="py-16"><Empty description={hasFilters ? "No room types match your filters." : "No room types found."} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${divider}`}>
              <thead className={thead}>
                <tr>
                  {["No.", "Room Type", "Resort", "Base Price", "Discount", "Max Occupancy", "Bed Count", "Bed Type", "Size (sqm)", "Status", "Action"].map((h) => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${thText} ${h === "No." ? "w-12" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${tbody} divide-y`}>
                {types.map((row, idx) => (
                  <tr key={row.id} className={dark ? "hover:bg-gray-700/50" : "hover:bg-[#F5F8FC]"}>
                    <td className={`px-4 py-4 text-sm font-medium ${dark ? "text-[#829AB1]" : "text-[#829AB1]"}`}>{(meta.current - 1) * meta.perPage + idx + 1}</td>
                    <td className="px-4 py-4">
                      <p className={`text-sm font-semibold ${titleCls}`}>{row.name}</p>
                    </td>
                    <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{row.resort?.name || "—"}</td>
                    <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>
                      <PriceWithDiscount price={row.base_price} percent={row.discount_percent} dark={dark} />
                    </td>
                    <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>
                      {Number(row.discount_percent ?? 0) > 0 ? `${formatPercent(row.discount_percent)}%` : "—"}
                    </td>
                    <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{row.max_occupancy != null ? row.max_occupancy : "—"}</td>
                    <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{row.bed_count != null ? row.bed_count : "—"}</td>
                    <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{row.bed_type || "—"}</td>
                    <td className={`px-4 py-4 text-sm whitespace-nowrap ${cellText}`}>{row.size_sqm != null ? row.size_sqm : "—"}</td>
                    <td className="px-4 py-4"><TypeStatusBadge status={row.status} dark={dark} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* <Button className={roomActionClass(dark)} onClick={() => setViewing(row)}>
                          <MdVisibility size={14} /> View
                        </Button> */}
                        {canEdit && (
                          <Button className={roomActionClass(dark, "edit")} onClick={() => openEdit(row)} classNames={"px-4 py-2 w-2"}> 
                            <MdEdit size={16} /> Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button className={roomActionClass(dark, "delete")} onClick={() => setConfirm({ type: "delete", row })} classNames={"border-red-500"}>
                            <MdDelete size={16} /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6">
          <ReviewPagination dark={dark} page={meta.current} lastPage={meta.last} from={meta.from} to={meta.to} total={meta.total} perPage={perPage} onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} itemLabel="room types" />
        </div>
      </div>

      <Modal title={editing ? "Edit Room Type" : "Add Room Type"} open={formOpen} onOk={saveType} onCancel={() => setFormOpen(false)} confirmLoading={saving} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="resort_id" label="Resort" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={resorts.map((r) => ({ value: r.id, label: r.name }))} /></Form.Item>
          <Form.Item name="name" label="Room Type Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="max_occupancy" label="Max occupancy" rules={[{ required: true }]}><InputNumber min={1} max={50} className="w-full" /></Form.Item>
          <Form.Item name="bed_count" label="Bed count"><InputNumber min={1} max={20} className="w-full" /></Form.Item>
          <Form.Item name="bed_type" label="Bed type"><Input /></Form.Item>
          <Form.Item name="size_sqm" label="Size (sqm)"><InputNumber min={0} className="w-full" /></Form.Item>
          <Form.Item
            name="amenities"
            label="Amenity tags (guest site pills)"
            tooltip="Shown on the resort “Choose your room” cards — e.g. Wi-Fi, Garden view."
          >
            <Select
              mode="tags"
              placeholder="Select or type amenities"
              options={GUEST_AMENITY_PRESETS.map((a) => ({ value: a, label: a }))}
            />
          </Form.Item>
          <Form.Item name="breakfast_included" label="Breakfast on guest card">
            <Select
              options={[
                { value: true, label: "Breakfast included" },
                { value: false, label: "Breakfast available (not included)" },
              ]}
            />
          </Form.Item>
          <Form.Item name="free_cancellation" label="Cancellation policy">
            <Select
              options={[
                { value: true, label: "Free cancellation" },
                { value: false, label: "Non-refundable" },
              ]}
            />
          </Form.Item>
          <Form.Item name="base_price" label="Base price" rules={[{ required: true }]}><InputNumber min={0} prefix="$" className="w-full" /></Form.Item>
          <Form.Item
            name="discount_percent"
            label="Discount (%)"
            tooltip="Applies to every room of this type unless a room sets its own discount."
            rules={[{ type: "number", min: 0, max: MAX_DISCOUNT_PERCENT, message: "Discount must be between 0 and 100." }]}
          >
            <InputNumber min={0} max={MAX_DISCOUNT_PERCENT} step={0.5} className="w-full" suffix="%" />
          </Form.Item>
          <div className="mb-4">
            <DiscountPreview price={basePriceWatch ?? 0} percent={discountWatch ?? 0} dark={dark} />
          </div>
          <Form.Item name="status" label="Status"><Select options={TYPE_STATUSES.map((s) => ({ value: s, label: s }))} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Room Type Details" open={Boolean(viewing)} onCancel={() => setViewing(null)} footer={null}>
        {viewing && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><h3 className={`text-lg font-bold ${titleCls}`}>{viewing.name}</h3><TypeStatusBadge status={viewing.status} dark={dark} /></div>
            <p className={`text-sm ${cellText}`}>{viewing.description || "No description provided."}</p>
            <p className={`text-sm ${cellText}`}>Resort: {viewing.resort?.name || "—"}</p>
            <p className={`text-sm ${cellText}`}>
              <PriceWithDiscount price={viewing.base_price} percent={viewing.discount_percent} dark={dark} suffix=" / night" />
            </p>
            <p className={`text-sm ${cellText}`}>Max occupancy: {viewing.max_occupancy ?? "—"} · Beds: {viewing.bed_count ?? "—"} · {viewing.bed_type || "—"} · {viewing.size_sqm != null ? `${viewing.size_sqm} sqm` : "—"}</p>
            <p className={`text-sm ${cellText}`}>{viewing.rooms_count ?? 0} rooms assigned</p>
            <RoomTypeAmenityChips type={viewing} facilities={facilities} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete room type"
        message={confirm ? `Delete room type "${confirm.row.name}"?` : ""}
        sub="This cannot be undone. Types with assigned rooms cannot be deleted."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={confirmBusy}
        dark={dark}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
