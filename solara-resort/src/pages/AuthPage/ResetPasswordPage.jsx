import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { resetPasswordWithToken } from '../../services/api/authApi.js';
import { getApiErrorMessage } from '../../services/api/errors.js';
import { resolveSafeInternalPath } from '../../util/safeRedirect.js';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useApp();

  const email = location.state?.email ?? '';
  const resetToken = location.state?.reset_token ?? '';
  const nextUrl = resolveSafeInternalPath(location.state?.next);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, resetToken, navigate]);

  const isMinLength = password.length >= 8;
  const isMatching = password === confirm && confirm.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isMinLength) {
      setError(t('auth.passwordTooShort', 'Password must be at least 8 characters.'));
      return;
    }
    if (!isMatching) {
      setError(t('auth.passwordMismatch', 'Passwords do not match.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPasswordWithToken({
        email,
        reset_token: resetToken,
        password,
        password_confirmation: confirm,
      });
      if (res?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/login?next=${encodeURIComponent(nextUrl)}`, {
            replace: true,
            state: { email },
          });
        }, 2200);
      } else {
        setError(res?.message || t('auth.resetFailed', 'Failed to reset password. Please try again.'));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.resetFailed', 'Failed to reset password. Please try again.')));
    } finally {
      setSubmitting(false);
    }
  };

  if (!email || !resetToken) return null;

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-bg">
      <div className="w-full max-w-md bg-surface border border-border p-8 sm:p-10 rounded-[var(--radius-modal)] shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-text tracking-tight">
            {t('auth.resetTitle', 'Reset Password')}
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {t('auth.resetSubtitle', 'Choose a new password for your resident account.')}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-[var(--radius-button)] bg-error/10 border border-error/30 text-xs text-error text-left">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-success">
            <CheckCircle2 className="w-10 h-10" />
            <p className="text-sm font-semibold">{t('auth.resetSuccess', 'Password reset successfully!')}</p>
            <p className="text-xs text-muted">{t('auth.redirectLogin', 'Redirecting to sign in…')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <Input
              label={t('auth.newPassword', 'New Password')}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
            />
            <Input
              label={t('auth.confirmPassword', 'Confirm Password')}
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <ul className="space-y-1 text-[11px]">
              <li className={isMinLength ? 'text-success' : 'text-muted'}>
                {isMinLength ? '✓' : '○'} {t('auth.passwordMinLength', 'At least 8 characters')}
              </li>
              <li className={isMatching ? 'text-success' : 'text-muted'}>
                {isMatching ? '✓' : '○'} {t('auth.passwordsMatch', 'Passwords match')}
              </li>
            </ul>

            <Button type="submit" variant="gold" size="md" className="w-full shadow-md mt-2" disabled={submitting}>
              {submitting ? t('auth.resetting', 'Resetting…') : t('auth.resetButton', 'Reset Password')}
            </Button>

            <Link
              to={`/login?next=${encodeURIComponent(nextUrl)}`}
              className="block text-center text-xs text-muted hover:text-gold transition-colors"
            >
              {t('auth.backToLogin', 'Back to Sign In')}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
