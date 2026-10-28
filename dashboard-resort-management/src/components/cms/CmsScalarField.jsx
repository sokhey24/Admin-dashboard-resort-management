import { useEffect, useState } from "react";
import { Button, Input, message } from "antd";
import { MdSave } from "react-icons/md";
import { request } from "../../util/request";
import { getCmsValue } from "./websiteContentUtils";
import { useCmsTheme } from "./cmsTheme";

const API = "admin/website-content";

export function CmsScalarField({
  section,
  fieldKey,
  label,
  grouped,
  onSaved,
  textarea = false,
  rows = 3,
  placeholder,
  langTag,
  embedded = false,
}) {
  const { label: labelCls, inputClass, sectionDivider: dividerCls } = useCmsTheme();
  const stored = getCmsValue(grouped, section, fieldKey);
  const [value, setValue] = useState(stored);
  const [saving, setSaving] = useState(false);
  const dirty = value !== stored;

  useEffect(() => {
    setValue(stored);
  }, [stored]);

  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("section", section);
    fd.append("key", fieldKey);
    fd.append("value", value);
    const res = await request(API, "post", fd);
    setSaving(false);
    if (!res?.errors) {
      message.success(`${label} saved`);
      onSaved?.();
    } else {
      message.error(res.errors.message || "Save failed");
    }
  };

  const InputComponent = textarea ? Input.TextArea : Input;

  const field = (
    <div className="flex flex-col gap-2 h-full">
      <label className={`text-xs font-semibold tracking-wide flex items-center gap-1.5 ${labelCls}`}>
        {langTag && (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {langTag}
          </span>
        )}
        {label}
      </label>
      <InputComponent
        className={`flex-1 ${inputClass}`}
        rows={textarea ? rows : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        type="primary"
        size="small"
        icon={<MdSave size={14} />}
        disabled={!dirty}
        loading={saving}
        onClick={save}
        className="self-end !h-8 !px-3 !text-xs !font-semibold shrink-0"
      >
        Save
      </Button>
    </div>
  );

  if (embedded) return field;

  return (
    <div className={`py-6 border-b last:border-b-0 ${dividerCls}`}>
      {field}
    </div>
  );
}

export function CmsBilingualScalarGroup({
  section,
  enKey,
  kmKey,
  label,
  grouped,
  onSaved,
  textarea = false,
  rows = 3,
}) {
  const { title: titleCls, sectionDivider: dividerCls } = useCmsTheme();

  return (
    <div className={`py-6 border-b last:border-b-0 ${dividerCls}`}>
      <p className={`text-sm font-semibold mb-4 ${titleCls}`}>{label}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <CmsScalarField
          section={section}
          fieldKey={enKey}
          label="English"
          grouped={grouped}
          onSaved={onSaved}
          textarea={textarea}
          rows={rows}
          langTag="EN"
          embedded
        />
        <CmsScalarField
          section={section}
          fieldKey={kmKey}
          label="Khmer"
          grouped={grouped}
          onSaved={onSaved}
          textarea={textarea}
          rows={rows}
          langTag="🇰🇭 KM"
          embedded
        />
      </div>
    </div>
  );
}
