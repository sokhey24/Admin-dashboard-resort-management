import { useCallback, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  Upload,
  message,
} from "antd";
import { MdAdd, MdDelete, MdEdit, MdUpload } from "react-icons/md";
import axios from "axios";
import config from "../../util/config";
import { getToken as getAdminToken } from "../../util/auth";
import { request } from "../../util/request";
import { BilingualField } from "./BilingualField";
import {
  arrayToLines,
  linesToArray,
  makeUniqueId,
  parseCmsList,
  slugifyId,
} from "./websiteContentUtils";

const API = "admin/website-content";

const ACTIVITY_CATEGORIES = [
  "Ocean & Water",
  "Wellness & Spa",
  "Culture & Culinary",
  "Expedition",
  "Adventure",
  "Nature",
];

const TRUST_ICONS = [
  { value: "Award", label: "Award" },
  { value: "Shield", label: "Shield" },
  { value: "Clock", label: "Clock" },
  { value: "Waves", label: "Waves" },
  { value: "Sparkles", label: "Sparkles" },
];

async function uploadListItemImage(section, assetKey, file) {
  const fd = new FormData();
  fd.append("section", section);
  fd.append("key", assetKey);
  fd.append("image", file);
  await axios.post(config.base_url + API, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(getAdminToken() ? { Authorization: `Bearer ${getAdminToken()}` } : {}),
    },
    timeout: 0,
  });
  const res = await request(API, "get");
  const row = res?.data?.[section]?.[assetKey];
  return row?.image_url || "";
}

function normalizeByVariant(variant, item, index, allItems, isNew) {
  const others = new Set(
    allItems.filter((_, i) => i !== index).map((a) => a.id).filter(Boolean)
  );

  if (variant === "activities") {
    const title = String(item.title || "").trim();
    const category = ACTIVITY_CATEGORIES.includes(item.category)
      ? item.category
      : ACTIVITY_CATEGORIES[0];
    const id = makeUniqueId(
      `act-${slugifyId(title)}`,
      others,
      isNew ? "" : item.id
    );
    return {
      id,
      title,
      title_km: String(item.title_km || "").trim(),
      category,
      category_km: String(item.category_km || "").trim(),
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

  if (variant === "services") {
    const title = String(item.title || "").trim();
    const id = makeUniqueId(`svc-${slugifyId(title)}`, others, isNew ? "" : item.id);
    const features = Array.isArray(item.features)
      ? item.features
      : linesToArray(item.featuresText);
    const features_km = Array.isArray(item.features_km)
      ? item.features_km
      : linesToArray(item.features_kmText);
    return {
      id,
      title,
      title_km: String(item.title_km || "").trim(),
      tagline: String(item.tagline || "").trim(),
      tagline_km: String(item.tagline_km || "").trim(),
      description: String(item.description || "").trim(),
      description_km: String(item.description_km || "").trim(),
      image: String(item.image || "").trim(),
      duration: String(item.duration || "").trim(),
      duration_km: String(item.duration_km || "").trim(),
      priceFrom: Number(item.priceFrom) >= 0 ? Number(item.priceFrom) : 0,
      features,
      features_km,
    };
  }

  if (variant === "dining") {
    const name = String(item.name || "").trim();
    const id = makeUniqueId(`dine-${slugifyId(name)}`, others, isNew ? "" : item.id);
    return {
      id,
      name,
      name_km: String(item.name_km || "").trim(),
      cuisine: String(item.cuisine || "").trim(),
      cuisine_km: String(item.cuisine_km || "").trim(),
      description: String(item.description || "").trim(),
      description_km: String(item.description_km || "").trim(),
      image: String(item.image || "").trim(),
      hours: String(item.hours || "").trim(),
      hours_km: String(item.hours_km || "").trim(),
      priceLevel: String(item.priceLevel || "").trim(),
    };
  }

  if (variant === "trust") {
    const title = String(item.title || "").trim();
    const id = makeUniqueId(`trust-${slugifyId(title)}`, others, isNew ? "" : item.id);
    return {
      id,
      icon: TRUST_ICONS.some((i) => i.value === item.icon) ? item.icon : "Award",
      title,
      title_km: String(item.title_km || "").trim(),
      description: String(item.description || "").trim(),
      description_km: String(item.description_km || "").trim(),
    };
  }

  return item;
}

function cardTitle(variant, item) {
  if (variant === "dining") return item.name || "Untitled venue";
  if (variant === "trust") return item.title || "Pillar";
  return item.title || "Untitled";
}

function cardSubtitle(variant, item) {
  if (variant === "activities") return item.category;
  if (variant === "services") return item.tagline;
  if (variant === "dining") return item.cuisine;
  if (variant === "trust") return item.icon;
  return "";
}

export function JsonListEditor({
  variant,
  section,
  grouped,
  onReload,
  title,
  description,
  emptyHint,
}) {
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [form] = Form.useForm();

  const items = useMemo(
    () => parseCmsList(grouped, section, "items"),
    [grouped, section]
  );

  const saveAll = useCallback(
    async (nextItems) => {
      const normalized = nextItems.map((row, i) =>
        normalizeByVariant(variant, row, i, nextItems, false)
      );
      setSaving(true);
      try {
        const res = await request(API, "post", {
          section,
          key: "items",
          value: JSON.stringify(normalized),
        });
        if (res?.errors) {
          message.error("Could not save list");
          return false;
        }
        message.success("List saved to guest website CMS");
        onReload?.();
        return true;
      } catch {
        message.error("Could not save list");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [variant, section, onReload]
  );

  const openCreate = () => {
    setEditIndex(null);
    form.resetFields();
    if (variant === "activities") {
      form.setFieldsValue({
        category: ACTIVITY_CATEGORIES[0],
        pricePerPerson: 0,
      });
    }
    if (variant === "services") {
      form.setFieldsValue({ priceFrom: 0, featuresText: "", features_kmText: "" });
    }
    if (variant === "trust") {
      form.setFieldsValue({ icon: "Award" });
    }
    setModalOpen(true);
  };

  const openEdit = (record, index) => {
    setEditIndex(index);
    const values = { ...record };
    if (variant === "services") {
      values.featuresText = arrayToLines(record.features);
      values.features_kmText = arrayToLines(record.features_km);
    }
    form.setFieldsValue(values);
    setModalOpen(true);
  };

  const handleDelete = (index) => {
    Modal.confirm({
      title: "Delete this item?",
      content: "It will be removed from the guest site after saving.",
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
      const isNewLast = editIndex === null;
      const normalized = draft.map((row, i) =>
        normalizeByVariant(
          variant,
          row,
          i,
          draft,
          isNewLast && i === draft.length - 1
        )
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

  const handleImageUpload = async (file) => {
    const values = form.getFieldsValue();
    const title = values.title || values.name || "item";
    const tempId = values.id || slugifyId(title) || `new-${Date.now()}`;
    const assetKey = `asset_${tempId}`;
    setImageUploading(true);
    try {
      const url = await uploadListItemImage(section, assetKey, file);
      form.setFieldsValue({ image: url });
      message.success("Image uploaded");
    } catch {
      message.error("Image upload failed");
    } finally {
      setImageUploading(false);
    }
    return false;
  };

  const renderModalForm = () => {
    if (variant === "activities") {
      return (
        <>
          <Form.Item name="id" label="ID" tooltip="Auto-generated from title if empty">
            <Input />
          </Form.Item>
          <BilingualField enName="title" kmName="title_km" enLabel="Title" required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item name="category" label="Category (EN)" rules={[{ required: true }]}>
              <Select options={ACTIVITY_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="category_km" label="Category (KM)">
              <Input />
            </Form.Item>
          </div>
          <BilingualField enName="duration" kmName="duration_km" enLabel="Duration" required />
          <BilingualField enName="schedule" kmName="schedule_km" enLabel="Schedule" required />
          <Form.Item name="pricePerPerson" label="Price per person (USD)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} precision={2} />
          </Form.Item>
          <Form.Item label="Image">
            <Space direction="vertical" className="w-full">
              <Form.Item name="image" noStyle rules={[{ required: true, message: "Upload or paste image URL" }]}>
                <Input placeholder="Image URL (upload below)" />
              </Form.Item>
              <Upload showUploadList={false} accept="image/*" beforeUpload={handleImageUpload}>
                <Button icon={<MdUpload />} loading={imageUploading}>Upload image</Button>
              </Upload>
            </Space>
          </Form.Item>
          <BilingualField enName="description" kmName="description_km" enLabel="Description" required textarea />
        </>
      );
    }

    if (variant === "services") {
      return (
        <>
          <Form.Item name="id" label="ID">
            <Input />
          </Form.Item>
          <BilingualField enName="title" kmName="title_km" enLabel="Title" required />
          <BilingualField enName="tagline" kmName="tagline_km" enLabel="Tagline" />
          <BilingualField enName="description" kmName="description_km" enLabel="Description" required textarea rows={4} />
          <BilingualField enName="duration" kmName="duration_km" enLabel="Duration" />
          <Form.Item name="priceFrom" label="From price (USD)">
            <InputNumber className="w-full" min={0} precision={2} />
          </Form.Item>
          <Form.Item label="Image">
            <Space direction="vertical" className="w-full">
              <Form.Item name="image" noStyle>
                <Input placeholder="Image URL" />
              </Form.Item>
              <Upload showUploadList={false} accept="image/*" beforeUpload={handleImageUpload}>
                <Button icon={<MdUpload />} loading={imageUploading}>Upload image</Button>
              </Upload>
            </Space>
          </Form.Item>
          <BilingualField enName="featuresText" kmName="features_kmText" enLabel="Features (one per line)" textarea rows={4} />
        </>
      );
    }

    if (variant === "dining") {
      return (
        <>
          <Form.Item name="id" label="ID">
            <Input />
          </Form.Item>
          <BilingualField enName="name" kmName="name_km" enLabel="Venue name" required />
          <BilingualField enName="cuisine" kmName="cuisine_km" enLabel="Cuisine" required />
          <BilingualField enName="description" kmName="description_km" enLabel="Description" textarea />
          <BilingualField enName="hours" kmName="hours_km" enLabel="Hours" />
          <Form.Item name="priceLevel" label="Price level" rules={[{ required: true }]}>
            <Input placeholder="e.g. $$$" />
          </Form.Item>
          <Form.Item label="Image">
            <Space direction="vertical" className="w-full">
              <Form.Item name="image" noStyle rules={[{ required: true }]}>
                <Input placeholder="Image URL" />
              </Form.Item>
              <Upload showUploadList={false} accept="image/*" beforeUpload={handleImageUpload}>
                <Button icon={<MdUpload />} loading={imageUploading}>Upload image</Button>
              </Upload>
            </Space>
          </Form.Item>
        </>
      );
    }

    if (variant === "trust") {
      return (
        <>
          <Form.Item name="icon" label="Icon" rules={[{ required: true }]}>
            <Select options={TRUST_ICONS} />
          </Form.Item>
          <BilingualField enName="title" kmName="title_km" enLabel="Title" required />
          <BilingualField enName="description" kmName="description_km" enLabel="Description" required textarea />
        </>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Typography.Title level={5} className="!mb-1">{title}</Typography.Title>
          {description && (
            <Typography.Paragraph type="secondary" className="!mb-0 text-sm">
              {description}
            </Typography.Paragraph>
          )}
        </div>
        <Button type="primary" icon={<MdAdd />} onClick={openCreate}>
          Add new item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-[#829AB1] text-sm">{emptyHint}</p>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item, index) => (
            <Col xs={24} sm={12} lg={variant === "trust" ? 12 : 8} key={item.id || index}>
              <Card
                hoverable
                cover={
                  item.image ? (
                    <img alt="" src={item.image} className="h-36 object-cover" />
                  ) : null
                }
                actions={[
                  <Button type="link" icon={<MdEdit />} onClick={() => openEdit(item, index)}>
                    Edit
                  </Button>,
                  <Button type="link" danger icon={<MdDelete />} onClick={() => handleDelete(index)}>
                    Delete
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={cardTitle(variant, item)}
                  description={cardSubtitle(variant, item)}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {saving && (
        <div className="flex justify-center py-4">
          <Spin />
        </div>
      )}

      <Modal
        title={editIndex === null ? "Add item" : "Edit item"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
        okText="Save to CMS"
        confirmLoading={saving}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-2">
          {renderModalForm()}
        </Form>
      </Modal>
    </div>
  );
}
