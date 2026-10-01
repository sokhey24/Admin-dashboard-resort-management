import { Modal } from "antd";
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

export default function ReviewDetailModal({ review, open, onClose }) {
  const dark = useDarkMode();
  const avatar = imageUrl(review?.user?.profile_image);

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
        </div>
      )}
    </Modal>
  );
}
