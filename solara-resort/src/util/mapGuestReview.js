import { resolveStorageUrl } from './media.js';

function avatarFallback(name) {
  const label = encodeURIComponent(name || 'Guest');
  return `https://ui-avatars.com/api/?name=${label}&background=d4af37&color=1a1a1a&size=128`;
}

export function mapGuestReviewFromApi(review) {
  if (!review) return null;

  const user = review.user || {};
  const room = review.room || {};
  const roomType = room.room_type || room.roomType || {};
  const resort = review.resort || {};
  const branch = review.branch || {};

  const guestName = user.name || 'Guest';
  const resolvedUrl = user.profile_image_url || resolveStorageUrl(user.profile_image);

  const roomTypeName = roomType.name || '';
  const roomNumber = room.room_number || '';
  const roomName = roomTypeName || 'Room';

  return {
    id: review.id,
    guestName,
    avatar: resolvedUrl || avatarFallback(guestName),
    rating: Math.round(Number(review.rating) || 0),
    title: review.title?.trim() || '',
    comment: review.comment?.trim() || '',
    roomName,
    roomNumber,
    roomLabel:
      roomTypeName && roomNumber
        ? `${roomTypeName} · Room ${roomNumber}`
        : roomTypeName || (roomNumber ? `Room ${roomNumber}` : ''),
    resortName: resort.name || '',
    branchName: branch.name || '',
    locationLabel: [resort.name, branch.name].filter(Boolean).join(' · '),
    createdAt: review.created_at || null,
    status: review.status || null,
    roomId: room.id || null,
  };
}

export function mapGuestReviewsPage(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const summary = payload?.summary && typeof payload.summary === 'object'
    ? {
        averageRating: Number(payload.summary.average_rating) || 0,
        totalReviews: Number(payload.summary.total_reviews) || 0,
      }
    : null;

  return {
    rows: rows.map(mapGuestReviewFromApi).filter(Boolean),
    meta: payload,
    summary,
  };
}
