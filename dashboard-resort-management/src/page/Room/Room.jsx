import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Form, Input, InputNumber, Modal, Select, Spin, message } from "antd";
import { MdAdd, MdSearch } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import usePermission from "../../util/usePermission";
import useRole from "../../util/useRole";
import ConfirmDialog from "../../components/ConfirmDialog";
import { RoomFeaturePanel } from "./RoomFeature.jsx";
import RoomCard from "./RoomCard.jsx";
import RoomImageUploader from "./RoomImageUploader.jsx";
import ReviewPagination from "./reviews/ReviewPagination";
import { ROOM_STATUSES, applyFormErrors, asList, paginationFrom, roomPrimaryBtnClass, roomModalOkClass, roomModalCancelClass, roomSearchClass, roomActionClass } from "./roomHelpers";

const EMPTY_FILTERS = {
  status: undefined,
  room_type_id: undefined,
  resort_id: undefined,
  branch_id: undefined,
};

export default function Room() {
  const dark = useDarkMode();
  const { canAny } = usePermission();
  const { isAdmin } = useRole();
  const canCreate = isAdmin || canAny("admin.resorts.create", "resort.rooms.create");
  const canEdit = isAdmin || canAny("admin.resorts.update", "resort.rooms.update");
  const canDelete = isAdmin || canAny("admin.resorts.delete", "resort.rooms.delete");

  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [meta, setMeta] = useState({ current: 1, last: 1, perPage: 10, total: 0, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [resorts, setResorts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formImages, setFormImages] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [reviewsByRoom, setReviewsByRoom] = useState({});
  const [form] = Form.useForm();
  const watchResort = Form.useWatch("resort_id", form);

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
    if (search) params.set("search", search);
    if (filters.status) params.set("status", filters.status);
    if (filters.room_type_id) params.set("room_type_id", String(filters.room_type_id));
    if (filters.resort_id) params.set("resort_id", String(filters.resort_id));
    if (filters.branch_id) params.set("branch_id", String(filters.branch_id));
    return params.toString();
  }, [page, perPage, search, filters]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return request(`admin/rooms?${query}`, "get").then((res) => {
      if (res?.errors) {
        setRooms([]);
        setError(res.errors.message ?? "Unable to load rooms.");
        message.error(res.errors.message ?? "Unable to load rooms.");
      } else {
        const list = asList(res);
        setRooms(list);
        setMeta(paginationFrom(res));
        if (res?.stats) setStats(res.stats);
        setViewing((prev) => (prev ? list.find((r) => r.id === prev.id) ?? prev : null));
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
    request("admin/branches", "get").then((res) => { if (!res?.errors) setBranches(asList(res)); });
    request("admin/room-types", "get").then((res) => { if (!res?.errors) setRoomTypes(asList(res)); });
    request("admin/reviews?per_page=50", "get").then((res) => {
      if (res?.errors) return;
      const grouped = {};
      asList(res).forEach((review) => {
        const roomId = review.room?.id;
        if (!roomId) return;
        if (!grouped[roomId]) grouped[roomId] = [];
        grouped[roomId].push(review);
      });
      setReviewsByRoom(grouped);
    });
  }, []);

  const formBranches = watchResort
    ? branches.filter((b) => String(b.resort_id) === String(watchResort))
    : branches;
  const filterBranches = filters.resort_id
    ? branches.filter((b) => String(b.resort_id) === String(filters.resort_id))
    : branches;

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "available" });
    setFormImages([]);
    setPendingFiles([]);
    setFormOpen(true);
  };

  const openEdit = (room) => {
    setEditing(room);
    form.setFieldsValue({
      resort_id: room.resort_id,
      branch_id: room.branch_id,
      room_type_id: room.room_type_id,
      room_number: room.room_number,
      floor: room.floor,
      view: room.view,
      price_per_night: room.price_per_night != null ? Number(room.price_per_night) : undefined,
      status: room.status,
      notes: room.notes,
    });
    setFormImages(Array.isArray(room.images) ? room.images : []);
    setPendingFiles([]);
    setFormOpen(true);
  };

  const uploadPendingImages = async (roomId) => {
    for (const item of pendingFiles) {
      const body = new FormData();
      body.append("image", item.file);
      body.append("room_id", String(roomId));
      if (item.isPrimary) body.append("is_primary", "1");
      const res = await request("admin/room-images", "post", body);
      if (res?.errors) {
        message.error(res.errors.message ?? `Unable to upload ${item.file.name}`);
        return false;
      }
    }
    return true;
  };

  const saveRoom = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const res = await request(editing ? `admin/rooms/${editing.id}` : "admin/rooms", editing ? "put" : "post", values);
    if (res?.errors) {
      setSaving(false);
      applyFormErrors(form, res.errors);
      message.error(res.errors.message ?? "Unable to save room.");
      return;
    }
    const room = res?.data;
    if (room?.id && pendingFiles.length) {
      await uploadPendingImages(room.id);
    }
    setSaving(false);
    message.success(editing ? "Room updated" : "Room created");
    setFormOpen(false);
    load();
  };

  const confirmDeleteRoom = async () => {
    if (!deleteRoomTarget) return;
    setDeleting(true);
    const res = await request(`admin/rooms/${deleteRoomTarget.id}`, "delete");
    setDeleting(false);
    if (res?.errors) {
      message.error(res.errors.message ?? "Unable to delete room.");
      return;
    }
    message.success("Room deleted");
    setDeleteRoomTarget(null);
    setViewing(null);
    load();
  };

  const hasFilters = Boolean(searchInput || filters.status || filters.room_type_id || filters.resort_id || filters.branch_id);
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className={`sticky top-0 z-20 -mx-4 px-4 pt-1 pb-4 mb-4 border-b ${
        dark ? "bg-gray-900/95 border-gray-700 backdrop-blur-sm" : "bg-[#F5F8FC]/95 border-[#D9E2EC] backdrop-blur-sm"
      }`}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className={`text-[26px] font-bold ${titleCls}`}>Room Management</h2>
            <p className={`text-sm ${subText}`}>{stats.total ?? meta.total} rooms in the current view</p>
          </div>
          {canCreate && (
            <Button icon={<MdAdd size={14} />} className={roomPrimaryBtnClass()} onClick={openCreate}>
              Add Room
            </Button>
          )}
        </div>

        <div className={`rounded-xl border shadow-sm p-4 ${card}`}>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 pointer-events-none" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search room, type, branch, resort…"
                className={roomSearchClass(dark)}
              />
            </div>
            <Select allowClear placeholder="Status" className="min-w-[130px]" value={filters.status}
              options={ROOM_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
              onChange={(value) => { setFilters((f) => ({ ...f, status: value })); setPage(1); }} />
            <Select allowClear showSearch optionFilterProp="label" placeholder="Room Type" className="min-w-[150px]" value={filters.room_type_id}
              options={roomTypes.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(value) => { setFilters((f) => ({ ...f, room_type_id: value })); setPage(1); }} />
            <Select allowClear showSearch optionFilterProp="label" placeholder="Resort" className="min-w-[150px]" value={filters.resort_id}
              options={resorts.map((r) => ({ value: r.id, label: r.name }))}
              onChange={(value) => { setFilters((f) => ({ ...f, resort_id: value, branch_id: undefined })); setPage(1); }} />
            <Select allowClear showSearch optionFilterProp="label" placeholder="Branch" className="min-w-[150px]" value={filters.branch_id}
              options={filterBranches.map((b) => ({ value: b.id, label: b.name }))}
              onChange={(value) => { setFilters((f) => ({ ...f, branch_id: value })); setPage(1); }} />
            {hasFilters && (
              <Button className={roomActionClass(dark)} onClick={() => { setSearchInput(""); setSearch(""); setFilters(EMPTY_FILTERS); setPage(1); }}>Reset</Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center justify-between" role="alert">
          <span>{error}</span>
          <Button className={roomActionClass(dark)} onClick={load}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className={`rounded-xl border min-h-[280px] flex items-center justify-center ${card}`}><Spin /></div>
      ) : rooms.length === 0 ? (
        <div className={`rounded-xl border py-16 ${card}`}>
          <Empty description={hasFilters ? "No rooms found. Try changing your search or filters." : "No rooms found. Create a new room to get started."} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                reviews={reviewsByRoom[room.id] || []}
                canEdit={canEdit}
                canDelete={canDelete}
                onView={setViewing}
                onEdit={openEdit}
                onDelete={setDeleteRoomTarget}
              />
            ))}
          </div>
          <ReviewPagination
            dark={dark}
            page={meta.current}
            lastPage={meta.last}
            from={meta.from}
            to={meta.to}
            total={meta.total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            itemLabel="rooms"
          />
        </>
      )}

      <Modal
        title={<span className={titleCls} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>{editing ? `Edit Room ${editing.room_number}` : "Add Room"}</span>}
        open={formOpen}
        onOk={saveRoom}
        onCancel={() => setFormOpen(false)}
        confirmLoading={saving}
        okText={editing ? "Save" : "Create"}
        destroyOnClose
        width={640}
        okButtonProps={{ className: roomModalOkClass() }}
        cancelButtonProps={{ className: roomModalCancelClass(dark) }}
        className={dark ? "[&_.ant-modal-content]:!bg-gray-800 [&_.ant-modal-header]:!bg-gray-800 [&_.ant-modal-close]:!text-gray-300" : ""}
        styles={{
          content: { fontFamily: "Inter, Poppins, sans-serif" },
          header: { fontFamily: "Inter, Poppins, sans-serif" },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="resort_id" label="Resort" rules={[{ required: true, message: "Select a resort" }]}>
            <Select showSearch optionFilterProp="label" options={resorts.map((r) => ({ value: r.id, label: r.name }))} onChange={() => form.setFieldValue("branch_id", undefined)} />
          </Form.Item>
          <Form.Item name="branch_id" label="Branch">
            <Select allowClear showSearch optionFilterProp="label" options={formBranches.map((b) => ({ value: b.id, label: b.name }))} />
          </Form.Item>
          <Form.Item name="room_type_id" label="Room Type" rules={[{ required: true, message: "Select a room type" }]}>
            <Select showSearch optionFilterProp="label" options={roomTypes.map((t) => ({ value: t.id, label: t.name }))} />
          </Form.Item>
          <Form.Item name="room_number" label="Room Number" rules={[{ required: true, message: "Enter a room number" }]}><Input maxLength={20} /></Form.Item>
          <Form.Item name="floor" label="Floor"><Input maxLength={50} /></Form.Item>
          <Form.Item name="view" label="View"><Input maxLength={100} /></Form.Item>
          <Form.Item name="price_per_night" label="Price per night" rules={[{ required: true, message: "Enter a price" }]}>
            <InputNumber min={0} className="w-full" prefix="$" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={ROOM_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
        </Form>
        <RoomImageUploader
          dark={dark}
          existingImages={formImages}
          pendingFiles={pendingFiles}
          onPendingChange={setPendingFiles}
          onExistingChange={setFormImages}
          canManage={editing ? canEdit : canCreate}
        />
      </Modal>

      <Modal
        title={<span className={titleCls} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>{viewing ? `Room ${viewing.room_number}` : "Room details"}</span>}
        open={Boolean(viewing)}
        onCancel={() => setViewing(null)}
        footer={null}
        width={420}
        destroyOnClose
        className={dark ? "[&_.ant-modal-content]:!bg-gray-800 [&_.ant-modal-header]:!bg-gray-800 [&_.ant-modal-close]:!text-gray-300" : ""}
        styles={{
          content: { fontFamily: "Inter, Poppins, sans-serif" },
          header: { fontFamily: "Inter, Poppins, sans-serif" },
        }}
      >
        {viewing && (
          <RoomFeaturePanel
            room={viewing}
            onClose={() => setViewing(null)}
            onEdit={(r) => { setViewing(null); openEdit(r); }}
            onDelete={(r) => { setViewing(null); setDeleteRoomTarget(r); }}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteRoomTarget)}
        title="Delete Room"
        message={deleteRoomTarget ? `Are you sure you want to delete room ${deleteRoomTarget.room_number}?` : ""}
        sub="This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        danger
        loading={deleting}
        dark={dark}
        onConfirm={confirmDeleteRoom}
        onCancel={() => setDeleteRoomTarget(null)}
      />
    </div>
  );
}
