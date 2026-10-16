import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGuestReviews } from '../../hooks/useGuestReviews.js';
import { GuestReviewCard } from '../reviews/GuestReviewCard.jsx';
import { GuestReviewCardSkeleton } from '../ui/Skeleton.jsx';
import { StarRatingDisplay, StarRatingInput } from '../reviews/StarRating.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { submitGuestReview } from '../../services/api/reviewsApi.js';
import { fetchMyBookings } from '../../services/api/bookingApi.js';
import { getApiErrorMessage, getValidationFieldErrors } from '../../services/api/errors.js';
import { mapBookingFromApi } from '../../util/mapBooking.js';

function roomOptionLabel(room) {
  const type = room.room_type_name || room.roomTypeName || 'Room';
  const number = room.room_number || room.roomNumber;
  return number ? `${type} · ${number}` : type;
}

export function DiningReviewsSection({ t, language, user }) {
  const {
    reviews,
    summary,
    loading,
    error,
    reload,
  } = useGuestReviews({ status: 'approved', per_page: 12 });

  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [reviewableRooms, setReviewableRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setReviewableRooms([]);
      setRoomId('');
      return;
    }

    let cancelled = false;
    setBookingsLoading(true);
    fetchMyBookings()
      .then((payload) => {
        if (cancelled) return;
        const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
        const rooms = [];
        rows.forEach((raw) => {
          const booking = mapBookingFromApi(raw);
          const eligibility = booking?.reviewEligibility;
          if (!eligibility?.can_review || !eligibility.rooms?.length) return;
          eligibility.rooms.forEach((room) => {
            if (!room.already_reviewed) {
              rooms.push({
                room_id: room.room_id,
                label: roomOptionLabel(room),
              });
            }
          });
        });
        setReviewableRooms(rooms);
        setRoomId(rooms[0] ? String(rooms[0].room_id) : '');
      })
      .catch(() => {
        if (!cancelled) setReviewableRooms([]);
      })
      .finally(() => {
        if (!cancelled) setBookingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const averageRating = summary?.averageRating ?? 0;
  const totalReviews = summary?.totalReviews ?? reviews.length;

  const displayReviews = useMemo(() => reviews.slice(0, 6), [reviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});
    setSubmitSuccess(false);

    if (!user) return;
    if (!roomId) {
      setFormError(t('dining.reviewNoEligibleStay', 'You need a completed stay before leaving a review.'));
      return;
    }
    if (rating < 1) {
      setFieldErrors({ rating: t('home.reviewRatingRequired', 'Please select a star rating.') });
      return;
    }
    if (!comment.trim()) {
      setFieldErrors({ comment: t('home.reviewCommentRequired', 'Please share your experience.') });
      return;
    }

    setSubmitting(true);
    try {
      await submitGuestReview({
        room_id: Number(roomId),
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      setSubmitSuccess(true);
      setRating(0);
      setTitle('');
      setComment('');
      await reload();
    } catch (err) {
      setFieldErrors(getValidationFieldErrors(err));
      setFormError(getApiErrorMessage(err, t('home.reviewSubmitFailed', 'Unable to submit your review.')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-bg py-16 sm:py-20" aria-labelledby="dining-reviews-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {t('dining.reviewsEyebrow', 'Guest Impressions')}
          </span>
          <h2 id="dining-reviews-heading" className="text-3xl font-serif font-bold text-text">
            {t('dining.reviewsTitle', 'Dining & Stay Reviews')}
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-light">
            {t(
              'dining.reviewsSubtitle',
              'Approved reflections from guests who have experienced Solara hospitality—including our restaurants and in-residence dining.'
            )}
          </p>
        </div>

        {!loading && !error && reviews.length > 0 && (
          <div className="flex flex-col items-center gap-2 mb-10">
            <p className="text-4xl font-serif font-bold text-text">{averageRating.toFixed(1)}</p>
            <StarRatingDisplay value={averageRating} size="lg" />
            <p className="text-xs text-muted">
              {totalReviews}{' '}
              {t('dining.reviewsCountLabel', 'verified reviews')}
            </p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[1, 2].map((key) => (
              <GuestReviewCardSkeleton key={key} />
            ))}
          </div>
        )}

        {error && !loading && (
          <ErrorState
            title={t('home.reviewsErrorTitle', 'Unable to load guest reviews')}
            message={error}
            onRetry={reload}
          />
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="mb-12">
            <EmptyState
              title={t('dining.reviewsEmptyTitle', 'No published reviews yet')}
              description={t(
                'dining.reviewsEmptyDesc',
                'Guest reviews will appear here once approved by our team.'
              )}
            />
          </div>
        )}

        {!loading && displayReviews.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
            {displayReviews.map((review) => (
              <GuestReviewCard
                key={review.id}
                review={review}
                language={language}
                verifiedLabel={t('home.verifiedGuest', 'Verified Guest')}
                variant="room"
              />
            ))}
          </div>
        )}

        <div className="max-w-xl mx-auto bg-surface border border-border rounded-[var(--radius-card)] p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-serif font-bold text-text mb-2">
            {t('dining.reviewFormTitle', 'Share Your Experience')}
          </h3>
          <p className="text-xs text-muted mb-6 font-light">
            {t(
              'dining.reviewFormHint',
              'Reviews require a signed-in account and an eligible completed stay. New submissions are moderated before publication.'
            )}
          </p>

          {!user && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-text-secondary">
                {t('dining.reviewSignIn', 'Sign in to leave a review after your stay.')}
              </p>
              <Link to="/login" className="inline-block">
                <Button variant="primary" size="sm" type="button">
                  {t('auth.loginTitle', 'Resident Portal Sign In')}
                </Button>
              </Link>
            </div>
          )}

          {user && bookingsLoading && (
            <p className="text-xs text-muted text-center py-4">{t('common.loading', 'Loading')}…</p>
          )}

          {user && !bookingsLoading && reviewableRooms.length === 0 && (
            <p className="text-xs text-muted text-center">
              {t(
                'dining.reviewNoEligibleStay',
                'No eligible stays found. Complete a stay to review your dining experience.'
              )}
            </p>
          )}

          {user && !bookingsLoading && reviewableRooms.length > 0 && (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {submitSuccess && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-input)] p-3">
                  {t('home.reviewSubmitted', 'Thank you for your review. It has been submitted and is awaiting approval.')}
                </p>
              )}
              {formError && (
                <p className="text-xs text-error bg-red-50 border border-red-200 rounded-[var(--radius-input)] p-3">
                  {formError}
                </p>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted font-medium block">
                  {t('home.reviewRoom', 'Room')}
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
                >
                  {reviewableRooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      {room.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted font-medium block">
                  {t('home.reviewRating', 'Rating')}
                </span>
                <StarRatingInput value={rating} onChange={setRating} disabled={submitting} />
                {fieldErrors.rating && (
                  <p className="text-[11px] text-error">{fieldErrors.rating}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted font-medium block">
                  {t('home.reviewTitle', 'Title')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={180}
                  className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
                  placeholder={t('home.reviewTitlePlaceholder', 'Amazing stay')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted font-medium block">
                  {t('home.reviewComment', 'Your review')}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2.5 text-xs focus:outline-none focus:border-gold"
                  placeholder={t('home.reviewCommentPlaceholder', 'Tell us about your experience…')}
                />
                {fieldErrors.comment && (
                  <p className="text-[11px] text-error">{fieldErrors.comment}</p>
                )}
              </div>

              <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={submitting}>
                {t('dining.reviewSubmit', 'Submit Review')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
