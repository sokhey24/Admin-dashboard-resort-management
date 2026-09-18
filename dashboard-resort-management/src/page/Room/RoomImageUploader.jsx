import { useEffect, useState } from "react";
import { Button, message } from "antd";
import { MdStar, MdClose } from "react-icons/md";
import ConfirmDialog from "../../components/ConfirmDialog";
import { request } from "../../util/request";
import {
  ROOM_IMAGE_ACCEPT,
  ROOM_IMAGE_MAX_KB,
  roomActionClass,
  roomImageSrc,
  validateRoomImageFile,
} from "./roomHelpers";

export default function RoomImageUploader({
  dark,
  existingImages = [],
  pendingFiles,
  onPendingChange,
  canManage,
  onExistingChange,
}) {
  const [busyId, setBusyId] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = pendingFiles.map((item) => ({
      id: item.id,
      url: URL.createObjectURL(item.file),
      isPrimary: item.isPrimary,
      name: item.file.name,
    }));
    setPreviews(urls);
    return () => urls.forEach((p) => URL.revokeObjectURL(p.url));
  }, [pendingFiles]);

  const addFiles = (fileList) => {
    const next = [...pendingFiles];
    Array.from(fileList || []).forEach((file) => {
      const error = validateRoomImageFile(file);
      if (error) {
        message.error(`${file.name}: ${error}`);
        return;
      }
      next.push({
        id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
        file,
        isPrimary: next.length === 0 && existingImages.length === 0,
      });
    });
    if (!next.some((f) => f.isPrimary) && existingImages.every((img) => !img.is_primary) && next.length) {
      next[0].isPrimary = true;
    }
    onPendingChange(next);
  };

  const removePending = (id) => {
    const next = pendingFiles.filter((f) => f.id !== id);
    if (next.length && !next.some((f) => f.isPrimary) && existingImages.every((img) => !img.is_primary)) {
      next[0].isPrimary = true;
    }
    onPendingChange(next);
  };

  const markPendingPrimary = (id) => {
    onPendingChange(pendingFiles.map((f) => ({ ...f, isPrimary: f.id === id })));
  };

  const setPrimaryExisting = async (image) => {
    setBusyId(image.id);
    const res = await request(`admin/room-images/${image.id}`, "put", { is_primary: true });
    setBusyId(null);
    if (res?.errors) {
      message.error(res.errors.message ?? "Unable to set primary image.");
      return;
    }
    onPendingChange(pendingFiles.map((f) => ({ ...f, isPrimary: false })));
    onExistingChange?.(
      existingImages.map((img) => ({ ...img, is_primary: img.id === image.id })),
    );
    message.success("Primary image updated");
  };

  const confirmRemoveExisting = async () => {
    if (!removeTarget) return;
    setBusyId(removeTarget.id);
    const res = await request(`admin/room-images/${removeTarget.id}`, "delete");
    setBusyId(null);
    if (res?.errors) {
      message.error(res.errors.message ?? "Unable to remove image.");
      return;
    }
    const remaining = existingImages.filter((img) => img.id !== removeTarget.id);
    const hasPrimary = remaining.some((img) => img.is_primary);
    onExistingChange?.(
      remaining.map((img, index) => ({ ...img, is_primary: hasPrimary ? img.is_primary : index === 0 })),
    );
    message.success("Image removed");
    setRemoveTarget(null);
  };

  const card = dark ? "bg-gray-700/40 border-gray-600" : "bg-[#F5F8FC] border-[#D9E2EC]";
  const labelCls = dark ? "text-gray-300" : "text-[#486581]";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className={`text-sm font-medium mb-1 ${labelCls}`}>Room images</p>
        <p className={`text-xs mb-2 ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>
          JPEG, PNG, GIF, or WebP. Max {ROOM_IMAGE_MAX_KB / 1024} MB each.
        </p>
        {canManage && (
          <input
            type="file"
            accept={ROOM_IMAGE_ACCEPT}
            multiple
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            className="block w-full text-sm"
            aria-label="Select room images"
          />
        )}
      </div>

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {existingImages.map((image) => {
            const src = roomImageSrc(image);
            return (
              <div key={image.id} className={`relative rounded-lg border overflow-hidden ${card}`}>
                {src ? (
                  <img src={src} alt="" className="w-full h-24 object-cover" />
                ) : (
                  <div className="h-24 flex items-center justify-center text-xs">No preview</div>
                )}
                {image.is_primary && (
                  <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-[#FF6B00] text-white">Primary</span>
                )}
                {canManage && (
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    {!image.is_primary && (
                      <Button
                        loading={busyId === image.id}
                        className={roomActionClass(dark, "edit")}
                        onClick={() => setPrimaryExisting(image)}
                      >
                        <MdStar size={12} /> Primary
                      </Button>
                    )}
                    <Button className={roomActionClass(dark, "delete")} onClick={() => setRemoveTarget(image)}>
                      <MdClose size={12} />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {previews.map((item) => (
            <div key={item.id} className={`relative rounded-lg border overflow-hidden ${card}`}>
              <img src={item.url} alt={item.name} className="w-full h-24 object-cover" />
              {item.isPrimary && (
                <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-[#FF6B00] text-white">Primary</span>
              )}
              <div className="absolute bottom-1 right-1 flex gap-1">
                {!item.isPrimary && (
                  <Button className={roomActionClass(dark, "edit")} onClick={() => markPendingPrimary(item.id)}>
                    <MdStar size={12} /> Primary
                  </Button>
                )}
                <Button className={roomActionClass(dark, "delete")} onClick={() => removePending(item.id)}>
                  <MdClose size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove image"
        message="Remove this room image? This cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        danger
        loading={busyId === removeTarget?.id}
        dark={dark}
        onConfirm={confirmRemoveExisting}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
