import { useState } from "react";
import { Button, Upload, message } from "antd";
import { MdDelete, MdUpload } from "react-icons/md";
import axios from "axios";
import config from "../../util/config";
import { getToken as getAdminToken } from "../../util/auth";
import { request } from "../../util/request";
import { useCmsTheme } from "./cmsTheme";

const API = "admin/website-content";

export function CmsMediaUpload({
  section,
  fieldKey,
  label,
  currentUrl,
  currentId,
  onSaved,
  accept = "image/*",
  isVideo = false,
  hint,
}) {
  const { title: titleCls, pageMuted, mediaPreview, sectionDivider: dividerCls } = useCmsTheme();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadFile = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("section", section);
    fd.append("key", fieldKey);
    fd.append("image", file);
    try {
      await axios.post(config.base_url + API, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(getAdminToken() ? { Authorization: `Bearer ${getAdminToken()}` } : {}),
        },
        timeout: 0,
      });
      message.success(`${label} uploaded`);
      onSaved?.();
    } catch (err) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.errors?.image?.[0] ??
        "Upload failed";
      message.error(msg);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async () => {
    if (!currentId) return;
    setDeleting(true);
    const res = await request(`${API}/${currentId}/image`, "delete");
    setDeleting(false);
    if (!res?.errors) {
      message.success(`${label} removed`);
      onSaved?.();
    } else {
      message.error("Failed to remove media");
    }
  };

  const preview = currentUrl;

  return (
    <div className={`py-5 border-b last:border-b-0 ${dividerCls} space-y-3`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`text-sm font-semibold ${titleCls}`}>{label}</span>
        {hint && <span className={`text-[11px] ${pageMuted}`}>{hint}</span>}
      </div>
      <div
        className={`relative rounded-xl overflow-hidden border flex items-center justify-center ${mediaPreview}`}
        style={{ minHeight: isVideo ? 200 : 160 }}
      >
        {preview ? (
          isVideo ? (
            <video src={preview} className="w-full max-h-52 object-cover" muted controls />
          ) : (
            <img src={preview} alt="" className="w-full max-h-52 object-cover" />
          )
        ) : (
          <span className={`text-xs py-10 ${pageMuted}`}>No file uploaded</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Upload showUploadList={false} accept={accept} beforeUpload={uploadFile} disabled={uploading}>
          <Button size="small" icon={<MdUpload />} loading={uploading}>
            {preview ? "Replace" : "Upload"}
          </Button>
        </Upload>
        {preview && currentId && (
          <Button size="small" danger icon={<MdDelete />} loading={deleting} onClick={handleDelete}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
