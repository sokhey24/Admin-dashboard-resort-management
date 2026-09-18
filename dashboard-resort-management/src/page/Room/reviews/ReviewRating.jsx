import { MdStar, MdStarBorder, MdStarHalf } from "react-icons/md";

export default function ReviewRating({ value, size = 16, showValue = false }) {
  const rating = Number(value);
  const safe = Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0;
  const stars = [];

  for (let i = 1; i <= 5; i += 1) {
    const diff = safe - (i - 1);
    if (diff >= 0.75) stars.push("full");
    else if (diff >= 0.25) stars.push("half");
    else stars.push("empty");
  }

  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rating ${Number.isFinite(rating) ? rating.toFixed(1) : "unavailable"}`}>
      <span className="inline-flex text-[#FF6B00]">
        {stars.map((type, idx) => {
          if (type === "full") return <MdStar key={idx} size={size} />;
          if (type === "half") return <MdStarHalf key={idx} size={size} />;
          return <MdStarBorder key={idx} size={size} />;
        })}
      </span>
      {showValue && (
        <span className="text-sm font-semibold tabular-nums">
          {Number.isFinite(rating) ? rating.toFixed(1) : "—"}
        </span>
      )}
    </span>
  );
}
