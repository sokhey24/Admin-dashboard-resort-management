import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Typography,
  message,
} from "antd";
import { MdAdd, MdOpenInNew, MdSave } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";

const API = "admin/website-content";
const CMS_SECTION = "activities";
const CMS_KEY = "items";

const ACTIVITY_CATEGORIES = [
  "Ocean & Water",
  "Wellness & Spa",
  "Culture & Culinary",
  "Expedition",
];

const CATEGORY_KM = {
  "Ocean & Water": "សមុទ្រ & ទឹក",
  "Wellness & Spa": "សុខុមាលភាព & ស្ប៉ា",
  "Culture & Culinary": "វប្បធម៌ & ម្ហូបអាហារ",
  Expedition: "ដំណើរផ្សងព្រេង",
};

const EMPTY_ACTIVITY = {
  id: "",
  title: "",
  title_km: "",
  category: "Ocean & Water",
  category_km: CATEGORY_KM["Ocean & Water"],
  duration: "",
  duration_km: "",
  pricePerPerson: 0,
  description: "",
  description_km: "",
  image: "",
  schedule: "",
  schedule_km: "",
};

function parseActivitiesItems(grouped) {
  const raw = grouped?.[CMS_SECTION]?.[CMS_KEY]?.value;
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function slugify(text) {
  return String(text || "activity")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function makeUniqueId(title, existingIds, currentId) {
  if (currentId && !existingIds.has(currentId)) return currentId;
  const base = `act-${slugify(title) || "experience"}`;
  let id = base;
  let n = 2;
  while (existingIds.has(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

function normalizeActivity(item, index, allItems, isNew) {
  const others = new Set(
    allItems
      .filter((_, i) => i !== index)
      .map((a) => a.id)
      .filter(Boolean)
  );
  const category = ACTIVITY_CATEGORIES.includes(item.category)
    ? item.category
    : "Ocean & Water";
  const title = String(item.title || "").trim();
  const id = makeUniqueId(title, others, isNew ? "" : item.id);

  return {
    id,
    title,
    title_km: String(item.title_km || "").trim(),
    category,
    category_km: String(item.category_km || CATEGORY_KM[category] || "").trim(),
    duration: String(item.duration || "").trim(),
    duration_km: String(item.duration_km || "").trim(),
    pricePerPerson: Number(item.pricePerPerson) >= 0 ? Number(item.pricePerPerson) : 0,
    description: String(item.description || "").trim(),
    description_km: String(item.description_km || "").trim(),
    image: String(item.image || "").trim(),
    schedule: String(item.schedule || "").trim(),
    schedule_km: String(item.schedule_km || "").trim(),
  };
}

export default function Manage_SolaraActivities() {
  const dark = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form] = Form.useForm();

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const text = dark ? "text-gray-100" : "text-[#102A43]";
  const muted = dark ? "text-gray-400" : "text-[#829AB1]";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request(API, "get");
      const grouped = res?.data ?? {};
      setItems(parseActivitiesItems(grouped));
    } catch {
      message.error("Failed to load Solara activities.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveAll = async (nextItems) => {
    const normalized = nextItems.map((row, i) =>
      normalizeActivity(row, i, nextItems, false)
    );
    setSaving(true);
    try {
      const res = await request(API, "post", {
        section: CMS_SECTION,
        key: CMS_KEY,
        value: JSON.stringify(normalized),
      });
      if (res?.errors) {
        message.error("Could not save activities.");
        return false;
      }
      setItems(normalized);
      message.success("Activities saved. They will appear on the Solara guest site.");
      return true;
    } catch {
      message.error("Could not save activities.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditIndex(null);
    form.setFieldsValue({ ...EMPTY_ACTIVITY });
    setModalOpen(true);
  };

  const openEdit = (record, index) => {
    setEditIndex(index);
    form.setFieldsValue({ ...record });
    setModalOpen(true);
  };

  const handleDelete = (index) => {
    Modal.confirm({
      title: "Delete this activity?",
      content: "It will be removed from the Solara /activities page after you save.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        const next = items.filter((_, i) => i !== index);
        await saveAll(next);
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const draft = [...items];
      if (editIndex === null) {
        draft.push(values);
      } else {
        draft[editIndex] = { ...draft[editIndex], ...values };
      }
      const normalized = draft.map((row, i) =>
        normalizeActivity(row, i, draft, editIndex === null && i === draft.length - 1)
      );
      const ok = await saveAll(normalized);
      if (ok) {
        setModalOpen(false);
        form.resetFields();
      }
    } catch {
      /* validation */
    }
  };

  const onCategoryChange = (category) => {
    form.setFieldsValue({
      category,
      category_km: CATEGORY_KM[category] || form.getFieldValue("category_km"),
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "Image",
        dataIndex: "image",
        width: 72,
        render: (url) =>
          url ? (
            <img
              src={url}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <span className={muted}>—</span>
          ),
      },
      { title: "Title (EN)", dataIndex: "title", ellipsis: true },
      { title: "Category", dataIndex: "category", width: 140 },
      {
        title: "Price / person",
        dataIndex: "pricePerPerson",
        width: 110,
        render: (v) => `$${Number(v || 0).toFixed(0)}`,
      },
      { title: "Duration", dataIndex: "duration", width: 100, ellipsis: true },
      {
        title: "Actions",
        key: "actions",
        width: 160,
        render: (_, record, index) => (
          <Space size="small">
            <Button type="link" size="small" onClick={() => openEdit(record, index)}>
              Edit
            </Button>
            <Button type="link" size="small" danger onClick={() => handleDelete(index)}>
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    [muted]
  );

  const guestPreviewUrl =
    import.meta.env.VITE_SOLARA_URL?.replace(/\/$/, "") || "http://localhost:5173";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className={`rounded-xl border p-5 md:p-6 ${card}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <Typography.Title level={4} className={`!mb-1 ${text}`}>
              Solara Activities (Guest Site)
            </Typography.Title>
            <Typography.Paragraph className={`!mb-0 ${muted}`}>
              Manage experiences shown on{" "}
              <strong className={text}>solara-resort → /activities</strong>. Content is stored as
              CMS JSON (<code>activities / items</code>). This does not include activity bookings.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Button
              icon={<MdOpenInNew />}
              href={`${guestPreviewUrl}/activities`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview guest page
            </Button>
            <Button type="primary" icon={<MdAdd />} onClick={openCreate}>
              Add activity
            </Button>
          </Space>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            rowKey="id"
            dataSource={items}
            columns={columns}
            pagination={{ pageSize: 8 }}
            locale={{
              emptyText: "No activities yet. Add one to show on the Solara activities page.",
            }}
          />
        )}

        {items.length > 0 && !loading && (
          <div className="mt-4 flex justify-end">
            <Button
              type="primary"
              icon={<MdSave />}
              loading={saving}
              onClick={() => saveAll(items)}
            >
              Save all
            </Button>
          </div>
        )}
      </div>

      <Modal
        title={editIndex === null ? "Add activity" : "Edit activity"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
        okText="Save"
        confirmLoading={saving}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item name="id" label="Activity ID" tooltip="Auto-generated from title if empty">
            <Input placeholder="e.g. act-catamaran-sunset" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="title"
              label="Title (English)"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="title_km" label="Title (Khmer)">
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="category"
              label="Category (English)"
              rules={[{ required: true }]}
            >
              <Select options={ACTIVITY_CATEGORIES.map((c) => ({ value: c, label: c }))} onChange={onCategoryChange} />
            </Form.Item>
            <Form.Item name="category_km" label="Category (Khmer)">
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item name="duration" label="Duration (English)" rules={[{ required: true }]}>
              <Input placeholder="e.g. 3.5 Hours" />
            </Form.Item>
            <Form.Item name="duration_km" label="Duration (Khmer)">
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item name="schedule" label="Schedule (English)" rules={[{ required: true }]}>
              <Input placeholder="e.g. Daily at 4:30 PM" />
            </Form.Item>
            <Form.Item name="schedule_km" label="Schedule (Khmer)">
              <Input />
            </Form.Item>
          </div>

          <Form.Item
            name="pricePerPerson"
            label="Price per person (USD)"
            rules={[{ required: true, type: "number", min: 0 }]}
          >
            <InputNumber className="w-full" min={0} precision={2} />
          </Form.Item>

          <Form.Item
            name="image"
            label="Image URL"
            rules={[{ required: true, message: "Image URL is required" }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (English)"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="description_km" label="Description (Khmer)">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
