import { Form, Input } from "antd";

/**
 * Stacked EN / KM fields for Ant Design Form (name = en key, kmName = *_km).
 */
export function BilingualField({
  enName,
  kmName,
  enLabel,
  kmLabel = "Khmer",
  required = false,
  textarea = false,
  rows = 3,
  placeholderEn,
  placeholderKm,
}) {
  const InputComponent = textarea ? Input.TextArea : Input;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
      <Form.Item
        name={enName}
        label={enLabel || enName}
        rules={required ? [{ required: true, message: "English text is required" }] : []}
      >
        <InputComponent rows={textarea ? rows : undefined} placeholder={placeholderEn} />
      </Form.Item>
      <Form.Item name={kmName} label={`${enLabel || enName} (${kmLabel})`}>
        <InputComponent rows={textarea ? rows : undefined} placeholder={placeholderKm} />
      </Form.Item>
    </div>
  );
}

/**
 * Standalone bilingual inputs (not inside Form) with labels.
 */
export function BilingualInputPair({
  enLabel,
  enValue,
  kmValue,
  onEnChange,
  onKmChange,
  textarea = false,
  rows = 3,
}) {
  const InputComponent = textarea ? Input.TextArea : Input;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-[#486581] mb-1.5">{enLabel} (English)</label>
        <InputComponent rows={textarea ? rows : undefined} value={enValue} onChange={(e) => onEnChange(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#486581] mb-1.5">{enLabel} (Khmer)</label>
        <InputComponent rows={textarea ? rows : undefined} value={kmValue} onChange={(e) => onKmChange(e.target.value)} />
      </div>
    </div>
  );
}
