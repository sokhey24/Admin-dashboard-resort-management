import { useState, useRef } from "react";
import { useDarkMode } from "../../util/DarkModeContext";
import { MdImage, MdCloudUpload } from "react-icons/md";

const CATEGORIES = ["Food & Beverage", "Room Amenities", "Spa & Wellness", "Activities", "Merchandise", "Other"];
const DELIVERIES = ["Standard Delivery", "Express Delivery", "In-Room Delivery", "Pickup Only"];

function Toggle({ checked, onChange, dark }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{ width: 64, height: 34, borderRadius: 17, background: checked ? "#FF6B00" : (dark ? "#374151" : "#E6EDF5"), transition: "background 0.2s", position: "relative", border: "none", cursor: "pointer", flexShrink: 0 }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 33 : 3,
        width: 28, height: 28, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)", transition: "left 0.2s",
      }} />
    </button>
  );
}

function Label({ children, dark }) {
  return (
    <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: dark ? "#d1d5db" : "#486581" }}>
      {children}
    </label>
  );
}

function Input({ placeholder, value, onChange, type = "text", dark, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", height: 56, borderRadius: 10, border: `1px solid ${focused ? "#FF6B00" : (dark ? "#374151" : "#D9E2EC")}`,
        outline: focused ? "3px solid rgba(255,107,0,0.15)" : "none",
        padding: "0 20px", fontSize: 17, fontFamily: "Inter, Poppins, sans-serif",
        background: dark ? "#1f2937" : "#fff", color: dark ? "#f3f4f6" : "#102A43",
        boxSizing: "border-box", transition: "border 0.15s, outline 0.15s",
        ...style,
      }}
    />
  );
}

function Select({ value, onChange, options, placeholder, dark }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", height: 56, borderRadius: 10, border: `1px solid ${focused ? "#FF6B00" : (dark ? "#374151" : "#D9E2EC")}`,
        outline: focused ? "3px solid rgba(255,107,0,0.15)" : "none",
        padding: "0 20px", fontSize: 17, fontFamily: "Inter, Poppins, sans-serif",
        background: dark ? "#1f2937" : "#fff", color: value ? (dark ? "#f3f4f6" : "#102A43") : "#829AB1",
        boxSizing: "border-box", appearance: "none", cursor: "pointer",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23829AB1' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center",
        transition: "border 0.15s, outline 0.15s",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Textarea({ placeholder, value, onChange, rows = 3, dark }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", borderRadius: 10, border: `1px solid ${focused ? "#FF6B00" : (dark ? "#374151" : "#D9E2EC")}`,
        outline: focused ? "3px solid rgba(255,107,0,0.15)" : "none",
        padding: "14px 20px", fontSize: 17, fontFamily: "Inter, Poppins, sans-serif",
        background: dark ? "#1f2937" : "#fff", color: dark ? "#f3f4f6" : "#102A43",
        boxSizing: "border-box", resize: "vertical", lineHeight: 1.6,
        transition: "border 0.15s, outline 0.15s",
      }}
    />
  );
}

function RichEditor({ value, onChange, dark }) {
  const [focused, setFocused] = useState(false);
  const tools = ["B", "I", "U", "H1", "H2", "UL", "OL", "Link"];
  return (
    <div style={{ border: `1px solid ${focused ? "#FF6B00" : (dark ? "#374151" : "#D9E2EC")}`, borderRadius: 10, overflow: "hidden", outline: focused ? "3px solid rgba(255,107,0,0.15)" : "none", transition: "border 0.15s, outline 0.15s" }}>
      <div style={{ display: "flex", gap: 2, padding: "8px 12px", borderBottom: `1px solid ${dark ? "#374151" : "#D9E2EC"}`, background: dark ? "#111827" : "#F5F8FC", flexWrap: "wrap" }}>
        {tools.map(t => (
          <button key={t} type="button" style={{ padding: "3px 9px", borderRadius: 6, border: `1px solid ${dark ? "#374151" : "#D9E2EC"}`, background: dark ? "#1f2937" : "#fff", color: dark ? "#d1d5db" : "#486581", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, Poppins, sans-serif" }}>
            {t}
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Write detailed product description here…"
        rows={6}
        style={{ width: "100%", border: "none", outline: "none", padding: "14px 20px", fontSize: 17, fontFamily: "Inter, Poppins, sans-serif", background: dark ? "#1f2937" : "#fff", color: dark ? "#f3f4f6" : "#102A43", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
      />
    </div>
  );
}

function UploadBox({ images, onFiles, dark }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "#FF6B00" : (dark ? "#374151" : "#D9E2EC")}`,
          borderRadius: 12, padding: "40px 20px", textAlign: "center", cursor: "pointer",
          background: dragging ? "rgba(255,107,0,0.04)" : (dark ? "#111827" : "#F5F8FC"),
          transition: "all 0.2s",
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,107,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <MdImage size={32} color="#FF6B00" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: dark ? "#f3f4f6" : "#102A43", marginBottom: 6 }}>Upload Image</div>
        <div style={{ fontSize: 14, color: "#829AB1", marginBottom: 4 }}>Drag & drop or <span style={{ color: "#FF6B00", fontWeight: 600 }}>browse</span></div>
        <div style={{ fontSize: 13, color: "#829AB1" }}>JPEG, PNG · Recommended 600×600 (1:1)</div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple hidden onChange={e => onFiles(Array.from(e.target.files))} />
      </div>
      {images.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img.preview} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${dark ? "#374151" : "#D9E2EC"}` }} />
              <button type="button" onClick={() => onFiles(null, i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ff4d4f", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ title, children, dark }) {
  return (
    <div style={{ background: dark ? "#1f2937" : "#fff", border: `1px solid ${dark ? "#374151" : "#D9E2EC"}`, borderRadius: 12, padding: 30, marginBottom: 24 }}>
      {title && <div style={{ fontSize: 18, fontWeight: 700, color: dark ? "#f3f4f6" : "#102A43", marginBottom: 22, paddingBottom: 14, borderBottom: `1px solid ${dark ? "#374151" : "#D9E2EC"}` }}>{title}</div>}
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange, dark }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${dark ? "#374151" : "#D9E2EC"}` }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: dark ? "#f3f4f6" : "#102A43" }}>{label}</div>
        {desc && <div style={{ fontSize: 13, color: "#829AB1", marginTop: 2 }}>{desc}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} dark={dark} />
    </div>
  );
}

const now = new Date();
const pad = n => String(n).padStart(2, "0");
const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default function ProductsAdd() {
  const dark = useDarkMode();

  const [form, setForm] = useState({
    name: "", category: "", sellingPrice: "", costPrice: "",
    quantity: "", delivery: "", shortDesc: "", longDesc: "",
    dateAdded: defaultDate, timeAdded: defaultTime,
  });
  const [images, setImages] = useState([]);
  const [discount, setDiscount] = useState(false);
  const [expiry, setExpiry] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFiles = (files, removeIdx) => {
    if (removeIdx !== undefined) {
      setImages(prev => prev.filter((_, i) => i !== removeIdx));
      return;
    }
    const mapped = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...mapped].slice(0, 6));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    alert("Product saved!");
  };

  const bg = dark ? "#111827" : "#F5F8FC";
  const titleColor = dark ? "#f3f4f6" : "#102A43";
  const subColor = dark ? "#9ca3af" : "#829AB1";

  return (
    <div style={{ minHeight: "100%", background: bg, padding: "0 0 40px", fontFamily: "Inter, Poppins, sans-serif" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: titleColor, lineHeight: 1.2 }}>Products Add</div>
          <div style={{ fontSize: 13, color: subColor, marginTop: 4 }}>
            <span style={{ color: "#FF6B00", cursor: "pointer" }}>Products</span>
            <span style={{ margin: "0 6px" }}>›</span>
            <span>Products Add</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => window.history.back()} style={{ height: 42, padding: "0 22px", borderRadius: 10, border: `1px solid ${dark ? "#374151" : "#D9E2EC"}`, background: dark ? "#1f2937" : "#fff", color: dark ? "#d1d5db" : "#486581", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ height: 42, padding: "0 28px", borderRadius: 10, border: "none", background: saving ? "#f0a070" : "#FF6B00", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>
            {saving ? "Saving…" : "Save Product"}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "34% 1fr", gap: 30, alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Upload */}
          <Card title="Product Images" dark={dark}>
            <UploadBox images={images} onFiles={handleFiles} dark={dark} />
            <div style={{ fontSize: 13, color: subColor, marginTop: 12, lineHeight: 1.6 }}>
              Upload up to 6 images. First image will be used as the main product thumbnail.
            </div>
          </Card>

          {/* Toggles */}
          <Card title="Product Options" dark={dark}>
            <ToggleRow label="Discount" desc="Enable discount pricing for this product" checked={discount} onChange={setDiscount} dark={dark} />
            <ToggleRow label="Expiry Date" desc="Product has an expiration date" checked={expiry} onChange={setExpiry} dark={dark} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: dark ? "#f3f4f6" : "#102A43" }}>Return Policy</div>
                <div style={{ fontSize: 13, color: "#829AB1", marginTop: 2 }}>Allow returns for this product</div>
              </div>
              <Toggle checked={returnPolicy} onChange={setReturnPolicy} dark={dark} />
            </div>
          </Card>

          {/* Date Added */}
          <Card title="Date Added" dark={dark}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <Label dark={dark}>Date</Label>
                <Input type="date" value={form.dateAdded} onChange={set("dateAdded")} dark={dark} />
              </div>
              <div>
                <Label dark={dark}>Time</Label>
                <Input type="time" value={form.timeAdded} onChange={set("timeAdded")} dark={dark} />
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          {/* Basic Info */}
          <Card title="Product Information" dark={dark}>
            <div style={{ marginBottom: 20 }}>
              <Label dark={dark}>Product Name <span style={{ color: "#ff4d4f" }}>*</span></Label>
              <Input placeholder="Enter product name" value={form.name} onChange={set("name")} dark={dark} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <Label dark={dark}>Product Category <span style={{ color: "#ff4d4f" }}>*</span></Label>
              <Select value={form.category} onChange={set("category")} options={CATEGORIES} placeholder="Select a category" dark={dark} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <Label dark={dark}>Selling Price ($) <span style={{ color: "#ff4d4f" }}>*</span></Label>
                <Input type="number" placeholder="0.00" value={form.sellingPrice} onChange={set("sellingPrice")} dark={dark} />
              </div>
              <div>
                <Label dark={dark}>Cost Price ($)</Label>
                <Input type="number" placeholder="0.00" value={form.costPrice} onChange={set("costPrice")} dark={dark} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <Label dark={dark}>Quantity in Stock <span style={{ color: "#ff4d4f" }}>*</span></Label>
                <Input type="number" placeholder="0" value={form.quantity} onChange={set("quantity")} dark={dark} />
              </div>
              <div>
                <Label dark={dark}>Delivery</Label>
                <Select value={form.delivery} onChange={set("delivery")} options={DELIVERIES} placeholder="Select delivery type" dark={dark} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Label dark={dark}>Short Description</Label>
              <Textarea placeholder="Brief product summary (shown in listings)…" value={form.shortDesc} onChange={set("shortDesc")} rows={3} dark={dark} />
              <div style={{ fontSize: 13, color: subColor, marginTop: 6 }}>Max 160 characters recommended</div>
            </div>

            <div>
              <Label dark={dark}>Product Long Description</Label>
              <RichEditor value={form.longDesc} onChange={set("longDesc")} dark={dark} />
            </div>
          </Card>

          {/* Save footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button type="button" onClick={() => window.history.back()} style={{ height: 48, padding: "0 28px", borderRadius: 10, border: `1px solid ${dark ? "#374151" : "#D9E2EC"}`, background: dark ? "#1f2937" : "#fff", color: dark ? "#d1d5db" : "#486581", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ height: 48, padding: "0 36px", borderRadius: 10, border: "none", background: saving ? "#f0a070" : "#FF6B00", color: "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>
              {saving ? "Saving…" : "Save Product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
