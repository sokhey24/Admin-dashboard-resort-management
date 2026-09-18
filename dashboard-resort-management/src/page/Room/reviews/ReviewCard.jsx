import { Button } from "antd";
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

export default function ReviewCard({ review, onView }) {
  const dark = useDarkMode();
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const bodyText = dark ? "text-gray-300" : "text-[#486581]";
  const card = dark ? "bg-gray-800 border-gray-700 hover:bg-gray-700/40" : "bg-white border-[#D9E2EC] hover:bg-[#F5F8FC]";
  const avatar = imageUrl(review.user?.profile_image);
  const initials = (review.user?.name || "?").slice(0, 1).toUpperCase();
  const roomLine = [
    review.room?.room_number ? `Room ${review.room.room_number}` : null,
    review.room?.room_type?.name,
  ].filter(Boolean).join(" • ") || "Room unavailable";
  const locationLine = [review.resort?.name, review.branch?.name].filter(Boolean).join(" • ") || "—";
  const title = review.title?.trim() || "Customer review";

  return (
    <article className={`rounded-xl border p-4 flex flex-col min-h-[250px] transition-colors duration-200 ${card}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {avatar ? (
            <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
          ) : (
            <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold ${dark ? "bg-gray-700 text-gray-200" : "bg-[#F5F8FC] text-[#102A43]"}`}>
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className={`font-semibold text-sm truncate ${titleCls}`}>{review.user?.name || "Guest"}</p>
            {review.user?.email ? (
              <a href={`mailto:${review.user.email}`} className={`text-xs truncate block hover:underline ${subText}`} onClick={(e) => e.stopPropagation()}>
                {review.user.email}
              </a>
            ) : (
              <p className={`text-xs truncate ${subText}`}>—</p>
            )}
          </div>
        </div>
        <ReviewStatusBadge status={review.status} dark={dark} />
      </div>

      <p className={`text-xs mb-1 ${subText}`}>{roomLine}</p>
      <p className={`text-xs mb-3 ${subText}`}>{locationLine}</p>

      <div className={`mb-2 ${titleCls}`}>
        <ReviewRating value={review.rating} />
      </div>

      <h3 className={`text-sm font-semibold mb-1 break-words ${titleCls}`}>{title}</h3>
      <p className={`text-sm mb-3 line-clamp-3 break-words flex-1 ${bodyText}`}>
        {review.comment?.trim() || "No written comment."}
      </p>

      <div className={`flex items-end justify-between gap-2 mt-auto pt-2 border-t ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
        <div className={`text-xs min-w-0 ${subText}`}>
          {review.booking?.booking_code && (
            <p className="truncate">Booking: {review.booking.booking_code}</p>
          )}
          <p>{formatWhen(review.created_at)}</p>
        </div>
        <Button size="small" onClick={() => onView?.(review)}>View</Button>
      </div>
    </article>
  );
}
