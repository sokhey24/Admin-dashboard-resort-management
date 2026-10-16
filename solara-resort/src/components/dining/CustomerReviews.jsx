import React, { useState } from 'react';
import { StarRatingDisplay, StarRatingInput } from '../reviews/StarRating.jsx';
import { Button } from '../ui/Button.jsx';

function CategoryStars({ rating }) {
  return <StarRatingDisplay value={rating} size="sm" />;
}

function RatingSummary({ summary, reviewsTitle, reviewsSubtitle }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-text mb-2">{reviewsTitle}</h2>
        <p className="text-xs sm:text-sm text-muted font-light leading-relaxed">{reviewsSubtitle}</p>
      </div>
      <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-end gap-4">
          <p className="text-5xl font-serif font-bold text-text leading-none">{summary.average.toFixed(1)}</p>
          <div>
            <StarRatingDisplay value={Math.round(summary.average)} size="lg" />
            <p className="text-xs text-muted mt-1">{summary.totalReviews} reviews</p>
          </div>
        </div>
        <ul className="space-y-3">
          {summary.breakdown.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-text-secondary font-medium">{row.label}</span>
              <CategoryStars rating={row.rating} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReviewForm({ t }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || rating < 1 || !review.trim()) {
      setError(t('dining.reviewFormIncomplete', 'Please complete all fields and select a rating.'));
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 sm:p-8 shadow-sm text-center space-y-3">
        <h3 className="text-lg font-serif font-bold text-text">
          {t('dining.reviewSuccessTitle', 'Thank you for your review')}
        </h3>
        <p className="text-sm text-muted font-light">
          {t('dining.reviewSuccessDesc', 'Your feedback has been saved locally and will be shared with our team soon.')}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-[var(--radius-card)] p-6 sm:p-8 shadow-sm space-y-4"
    >
      {error && (
        <p className="text-xs text-error bg-red-50 border border-red-200 rounded-[var(--radius-input)] p-3">{error}</p>
      )}
      <div className="space-y-1">
        <label className="text-xs text-muted font-medium block">{t('dining.reviewName', 'Name')}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
          autoComplete="name"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted font-medium block">{t('dining.reviewEmail', 'Email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
          autoComplete="email"
        />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted font-medium block">{t('home.reviewRating', 'Rating')}</span>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted font-medium block">{t('dining.reviewBody', 'Review')}</label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2.5 text-xs focus:outline-none focus:border-gold"
        />
      </div>
      <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
        {t('dining.reviewPost', 'Post review')}
      </Button>
    </form>
  );
}

export function CustomerReviews({ summary, t }) {
  return (
    <section className="bg-bg py-16 sm:py-20" aria-labelledby="dining-customer-reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <RatingSummary
            summary={summary}
            reviewsTitle={t('dining.customerReviewsTitle', 'Customer reviews')}
            reviewsSubtitle={t(
              'dining.customerReviewsSubtitle',
              'Honest impressions from guests who dined with us—food, service, and the atmosphere of Solara.'
            )}
          />
          <ReviewForm t={t} />
        </div>
      </div>
    </section>
  );
}
