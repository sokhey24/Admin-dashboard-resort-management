import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { sendPasswordResetOtp } from '../../services/api/authApi.js';
import { getApiErrorMessage } from '../../services/api/errors.js';
import { resolveSafeInternalPath } from '../../util/safeRedirect.js';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = resolveSafeInternalPath(searchParams.get('next'));
  const { t } = useApp();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(t('auth.forgotEmailRequired', 'Please enter your email address.'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('auth.forgotEmailInvalid', 'Please enter a valid email address.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendPasswordResetOtp(trimmed);
      if (res?.success) {
        setSent(true);
        setTimeout(() => {
          navigate('/verify-otp', { state: { email: trimmed, next: nextUrl } });
        }, 1200);
      } else {
        setError(res?.message || t('auth.forgotSendFailed', 'Something went wrong. Please try again.'));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.forgotSendFailed', 'Something went wrong. Please try again.')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-bg">
      <div className="w-full max-w-md bg-surface border border-border p-8 sm:p-10 rounded-[var(--radius-modal)] shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo asLink={false} imgClassName="h-12 w-12 object-contain" />
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-text tracking-tight">
            {t('auth.forgotTitle', 'Forgot Password')}
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {t('auth.forgotSubtitle', 'Enter your email to receive a 6-digit verification code.')}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-[var(--radius-button)] bg-error/10 border border-error/30 text-xs text-error text-left">
            {error}
          </div>
        )}

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-success">
            <CheckCircle2 className="w-10 h-10" />
            <p className="text-sm font-medium">{t('auth.codeSent', 'Verification code sent! Redirecting…')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <Input
              label={t('auth.email', 'Resident Email Address')}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="resident@example.com"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Button type="submit" variant="gold" size="md" className="w-full shadow-md mt-2" disabled={submitting}>
              {submitting
                ? t('auth.sendingCode', 'Sending…')
                : t('auth.sendCodeButton', 'Send Verification Code')}
            </Button>

            <Link
              to={`/login?next=${encodeURIComponent(nextUrl)}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('auth.backToLogin', 'Back to Sign In')}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
