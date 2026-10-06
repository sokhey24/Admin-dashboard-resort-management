import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { StarRatingInput } from './StarRating.jsx';
import { submitGuestReview, updateGuestReview } from '../../services/api/reviewsApi.js';
import { getApiErrorMessage, getValidationFieldErrors } from '../../services/api/errors.js';

function roomOptionLabel(room) {
  const type = room.room_type_name || room.roomTypeName || 'Room';
  const number = room.room_number || room.roomNumber;
  return number ? `${type} · ${number}` : type;
}

export function ReviewFormModal({
  isOpen,
  onClose,
  booking,
  editingReview,
  t,
  language,
  onSubmitted,
}) {
  const isEdit = Boolean(editingReview?.id);

  const reviewableRooms = useMemo(() => {
    if (isEdit) return [];
    const eligibility = booking?.reviewEligibility;
    if (!eligibility?.rooms?.length) return [];
    return eligibility.rooms.filter((r) => !r.already_reviewed);
  }, [booking, isEdit]);

  const [roomId, setRoomId] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setRoomId('');
      setRating(editingReview.rating || 0);
      setTitle(editingReview.title || '');
      setComment(editingReview.comment || '');
    } else {
      const first = reviewableRooms[0];
      setRoomId(first ? String(first.room_id) : '');
      setRating(0);
      setTitle('');
      setComment('');
    }
    setError('');
    setFieldErrors({});
  }, [isOpen, booking?.apiId, reviewableRooms, isEdit, editingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!isEdit && !roomId) {
      setError(t('home.reviewSelectRoom', 'Select a room to review.'));
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
      if (isEdit) {
        await updateGuestReview(editingReview.id, {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        });
      } else {
        await submitGuestReview({
          room_id: Number(roomId),
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        });
      }
      onSubmitted?.();
      onClose();
    } catch (err) {
      setFieldErrors(getValidationFieldErrors(err));
      setError(getApiErrorMessage(err, t('home.reviewSubmitFailed', 'Unable to submit your review.')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('account.editReview', 'Edit Review') : t('home.writeReview', 'Write a Review')}
      subtitle={
        isEdit
          ? t('account.editReviewSubtitle', 'Update your pending review before it is published.')
          : t('home.reviewModalSubtitle', 'Share feedback about your completed stay. Reviews are published after staff approval.')
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {isEdit && editingReview?.roomLabel && (
          <p className="text-xs text-muted">
            {t('home.reviewRoom', 'Room')}:{' '}
            <span className="text-text font-medium">{editingReview.roomLabel}</span>
          </p>
        )}

        {!isEdit && reviewableRooms.length > 1 && (
          <div>
            <label htmlFor="review-room" className="text-xs font-medium text-text block mb-1.5">
              {t('home.reviewRoom', 'Room')}
            </label>
            <select
              id="review-room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-border bg-surface px-3 py-2 text-sm text-text"
            >
              {reviewableRooms.map((room) => (
                <option key={room.room_id} value={String(room.room_id)}>
                  {roomOptionLabel(room)}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isEdit && reviewableRooms.length === 1 && (
          <p className="text-xs text-muted">
            {t('home.reviewRoom', 'Room')}:{' '}
            <span className="text-text font-medium">{roomOptionLabel(reviewableRooms[0])}</span>
          </p>
        )}

        <div>
          <span className="text-xs font-medium text-text block mb-2">
            {t('home.rating', 'Rating')}
          </span>
          <StarRatingInput
            value={rating}
            onChange={setRating}
            disabled={submitting}
            labels={{
              group: t('home.rating', 'Rating'),
              star: (n) =>
                n === 1
                  ? t('home.rateOneStar', 'Rate 1 star')
                  : language === 'km'
                    ? `វាយផ្កាយ ${n} ផ្កាយ`
                    : `Rate ${n} stars`,
            }}
          />
          {fieldErrors.rating && (
            <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.rating}</p>
          )}
        </div>

        <div>
          <label htmlFor="review-title" className="text-xs font-medium text-text block mb-1.5">
            {t('home.reviewTitle', 'Title')}
          </label>
          <input
            id="review-title"
            type="text"
            maxLength={180}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('home.reviewTitlePlaceholder', 'Amazing stay')}
            className="w-full rounded-[var(--radius-button)] border border-border bg-surface px-3 py-2 text-sm text-text"
          />
        </div>

        <div>
          <label htmlFor="review-comment" className="text-xs font-medium text-text block mb-1.5">
            {t('home.reviewComment', 'Your review')}
          </label>
          <textarea
            id="review-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('home.reviewCommentPlaceholder', 'Tell us about your experience…')}
            className="w-full rounded-[var(--radius-button)] border border-border bg-surface px-3 py-2 text-sm text-text resize-y min-h-[96px]"
          />
          {fieldErrors.comment && (
            <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.comment}</p>
          )}
          {fieldErrors.room_id && (
            <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.room_id}</p>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-300/90 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="gold" size="sm" disabled={submitting}>
            {submitting
              ? language === 'km'
                ? 'កំពុងដាក់ស្នើ…'
                : 'Submitting…'
              : isEdit
                ? t('account.saveReview', 'Save Review')
                : t('home.submitReview', 'Submit Review')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
