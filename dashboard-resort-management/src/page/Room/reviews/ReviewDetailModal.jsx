import { useState } from "react";
import { Modal, Button, Popconfirm } from "antd";
import { useDarkMode } from "../../../util/DarkModeContext";
import { imageUrl } from "../roomHelpers";
import ReviewRating from "./ReviewRating";
import ReviewStatusBadge from "./ReviewStatusBadge";

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({ label, children, dark }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 py-1.5 text-sm">
      <span className={dark ? "text-gray-400" : "text-[#829AB1]"}>{label}</span>
      <span className={`break-words ${dark ? "text-gray-200" : "text-[#102A43]"}`}>{children}</span>
    </div>
  );
}

export default function ReviewDetailModal({
  review,
  open,
  onClose,
  canModerate = false,
  onStatusChange,
}) {
  const dark = useDarkMode();
  const avatar = imageUrl(review?.user?.profile_image);
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState(null);

  const setStatus = async (status) => {
    if (!review?.id || saving) return;
    setSaving(true);
    setAction(status);
    try {
      const ok = await onStatusChange?.(review.id, status);
      if (ok) onClose?.();
    } finally {
      setSaving(false);
      setAction(null);
    }
  };

  const isPending = String(review?.status || "").toLowerCase() === "pending";

  return (
    <Modal
      title="Review details"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      {review && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            {avatar ? (
              <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${dark ? "bg-gray-700 text-gray-200" : "bg-[#F5F8FC] text-[#102A43]"}`}>
                {(review.user?.name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className={`font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>{review.user?.name || "Guest"}</p>
              <p className={`text-xs ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{review.user?.email || "—"}</p>
            </div>
          </div>

          <Row label="Room" dark={dark}>
            {[review.room?.room_number ? `Room ${review.room.room_number}` : null, review.room?.room_type?.name].filter(Boolean).join(" • ") || "—"}
          </Row>
          <Row label="Resort" dark={dark}>{review.resort?.name || "—"}</Row>
          <Row label="Branch" dark={dark}>{review.branch?.name || "—"}</Row>
          <Row label="Rating" dark={dark}><ReviewRating value={review.rating} /></Row>
          <Row label="Status" dark={dark}><ReviewStatusBadge status={review.status} dark={dark} /></Row>
          <Row label="Booking" dark={dark}>{review.booking?.booking_code || "—"}</Row>
          <Row label="Title" dark={dark}>{review.title?.trim() || "—"}</Row>
          <Row label="Review" dark={dark}>{review.comment?.trim() || "No written comment."}</Row>
          <Row label="Created" dark={dark}>{formatWhen(review.created_at)}</Row>
          <Row label="Updated" dark={dark}>{formatWhen(review.updated_at)}</Row>

          {canModerate && isPending && (
            <div className="flex flex-wrap justify-end gap-2 mt-6 pt-4 border-t border-dashed border-gray-600/30">
              <Popconfirm
                title="Reject this review?"
                description="Guests will not see this review on the website."
                okText="Reject"
                okButtonProps={{ danger: true, loading: saving && action === "rejected" }}
                cancelText="Cancel"
                onConfirm={() => setStatus("rejected")}
                disabled={saving}
              >
                <Button danger disabled={saving}>
                  Reject
                </Button>
              </Popconfirm>
              <Button
                type="primary"
                loading={saving && action === "approved"}
                disabled={saving}
                onClick={() => setStatus("approved")}
              >
                Approve
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
