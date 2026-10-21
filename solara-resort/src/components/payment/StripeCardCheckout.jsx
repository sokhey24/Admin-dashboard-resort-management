import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { createStripePaymentIntent, syncStripePayment } from '../../services/api/paymentApi.js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

function CheckoutForm({ paymentDbId, onPaid, onError, t }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || t('payment.cardFailed', 'Card payment failed.'));
      onError?.(error.message);
      setSubmitting(false);
      return;
    }

    try {
      const sync = await syncStripePayment(paymentDbId);
      if (sync.paid) {
        onPaid?.();
      } else {
        setMessage(sync.message || t('payment.cardPending', 'Payment is processing…'));
        setSubmitting(false);
      }
    } catch (err) {
      setMessage(err?.message || t('payment.cardPending', 'Payment is processing…'));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left max-w-md mx-auto">
      <PaymentElement />
      {message && <p className="text-xs text-rose-400">{message}</p>}
      <Button type="submit" variant="gold" className="w-full" disabled={!stripe || submitting}>
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('payment.processing', 'Processing…')}
          </span>
        ) : (
          t('payment.payWithCard', 'Pay with card')
        )}
      </Button>
    </form>
  );
}

export default function StripeCardCheckout({ bookingApiId, amount, currency, onPaid, t }) {
  const [clientSecret, setClientSecret] = useState('');
  const [paymentDbId, setPaymentDbId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(`stripe-${bookingApiId}-${Date.now()}`);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  const init = useCallback(async () => {
    if (!bookingApiId || !publishableKey) return;
    setLoading(true);
    setError('');
    try {
      const data = await createStripePaymentIntent(bookingApiId, requestIdRef.current);
      setClientSecret(data.client_secret || '');
      setPaymentDbId(data.id);
      if (!data.client_secret) {
        setError(t('payment.stripeUnavailable', 'Card checkout is not available.'));
      }
    } catch (err) {
      setError(err?.response?.data?.errors?.stripe?.[0] || err?.message || t('payment.stripeLoadFailed', 'Unable to start card payment.'));
    } finally {
      setLoading(false);
    }
  }, [bookingApiId, t]);

  useEffect(() => {
    init();
  }, [init]);

  if (!publishableKey) {
    return (
      <p className="text-sm text-muted py-6">
        {t('payment.stripeNotConfigured', 'Card payments are not configured for this environment.')}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <p className="text-sm">{t('payment.preparingCard', 'Preparing secure checkout…')}</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={init} />;
  }

  if (!clientSecret || !stripePromise) {
    return null;
  }

  const options = { clientSecret, appearance: { theme: 'night', labels: 'floating' } };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted text-center">
        {t('payment.cardAmount', 'Amount')}:{' '}
        <span className="text-gold font-semibold">
          {Number(amount).toFixed(2)} {String(currency || 'USD').toUpperCase()}
        </span>
      </p>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm paymentDbId={paymentDbId} onPaid={onPaid} t={t} />
      </Elements>
    </div>
  );
}
