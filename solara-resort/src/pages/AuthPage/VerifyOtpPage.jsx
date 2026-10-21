import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { resendPasswordResetOtp, verifyPasswordResetOtp } from '../../services/api/authApi.js';
import { getApiErrorMessage } from '../../services/api/errors.js';
import { resolveSafeInternalPath } from '../../util/safeRedirect.js';

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 10 * 60;
const RESEND_COOLDOWN = 60;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useApp();

  const email = location.state?.email ?? '';
  const nextUrl = resolveSafeInternalPath(location.state?.next);

  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const tmr = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(tmr);
  }, [countdown]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const tmr = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(tmr);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
      const next = [...digits];
      for (let i = 0; i < OTP_LENGTH; i += 1) next[i] = pasted[i] ?? '';
      setDigits(next);
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError(t('auth.otpIncomplete', 'Please enter the complete 6-digit code.'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await verifyPasswordResetOtp({ email, otp });
      if (res?.success && res?.reset_token) {
        navigate('/reset-password', {
          state: { email, reset_token: res.reset_token, next: nextUrl },
        });
        return;
      }
      setError(res?.message || t('auth.otpInvalid', 'Invalid verification code.'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.otpInvalid', 'Invalid verification code.')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await resendPasswordResetOtp(email);
      if (res?.success) {
        setDigits(Array(OTP_LENGTH).fill(''));
        setCountdown(EXPIRY_SECONDS);
        setResendCooldown(RESEND_COOLDOWN);
        setSuccessMsg(t('auth.resendSuccess', 'A new verification code has been sent to your email.'));
        inputRefs.current[0]?.focus();
      } else {
        setError(res?.message || t('auth.resendFailed', 'Failed to resend code.'));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.resendFailed', 'Failed to resend code.')));
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-bg">
      <div className="w-full max-w-md bg-surface border border-border p-8 sm:p-10 rounded-[var(--radius-modal)] shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-text tracking-tight">
            {t('auth.verifyTitle', 'Verify Your Email')}
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {t('auth.verifySubtitle', 'Enter the code sent to')}{' '}
            <span className="font-medium text-text">{email}</span>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-[var(--radius-button)] bg-error/10 border border-error/30 text-xs text-error text-left">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-[var(--radius-button)] bg-success/10 border border-success/30 text-xs text-success text-left">
            {successMsg}
          </div>
        )}

        <div className="flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={`w-10 h-12 sm:w-11 text-center text-lg font-bold border-2 rounded-[var(--radius-button)] bg-bg text-text focus:outline-none focus:border-gold transition-colors ${
                d ? 'border-gold/60' : 'border-border'
              }`}
            />
          ))}
        </div>

        <div className="text-xs text-muted">
          {countdown > 0 ? (
            <>
              {t('auth.codeExpiresIn', 'Code expires in:')}{' '}
              <span className={`font-mono font-semibold ${countdown < 60 ? 'text-error' : 'text-text'}`}>
                {formatTime(countdown)}
              </span>
            </>
          ) : (
            <span className="text-error font-medium">
              {t('auth.codeExpired', 'Code has expired. Please request a new one.')}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="gold"
          size="md"
          className="w-full shadow-md"
          disabled={submitting || countdown <= 0}
          onClick={handleVerify}
        >
          {submitting ? t('auth.verifyingCode', 'Verifying…') : t('auth.verifyButton', 'Verify Code')}
        </Button>

        <div className="text-xs">
          {resendCooldown > 0 && countdown > 0 ? (
            <span className="text-muted">
              {t('auth.resendIn', 'Resend available in')} {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="text-gold font-medium hover:underline disabled:opacity-50 bg-transparent border-0 cursor-pointer"
            >
              {resending ? t('auth.resendingCode', 'Sending…') : t('auth.resendCode', 'Resend Code')}
            </button>
          )}
        </div>

        <Link
          to={`/forgot-password?next=${encodeURIComponent(nextUrl)}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('auth.back', 'Back')}
        </Link>
      </div>
    </div>
  );
}
