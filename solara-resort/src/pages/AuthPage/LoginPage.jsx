import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { resolveSafeInternalPath } from '../../util/safeRedirect.js';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const nextUrl = resolveSafeInternalPath(searchParams.get('next'));

  const { loginWithPassword, verifyTwoFactor, user, authStatus, t, language } = useApp();

  const [email, setEmail] = useState(() => location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [registeredNotice] = useState(() => Boolean(location.state?.registered));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      navigate(nextUrl, { replace: true });
    }
  }, [user, authStatus, navigate, nextUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(
        language === 'km'
          ? 'សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក។'
          : 'Please provide your resident email and password.'
      );
      return;
    }

    setSubmitting(true);
    setError('');
    const result = await loginWithPassword({ email, password });
    setSubmitting(false);

    if (result.twoFactorRequired && result.challengeToken) {
      setTwoFactorToken(result.challengeToken);
      setError('');
      return;
    }

    if (!result.ok) {
      setError(result.error || 'Unable to sign in.');
      return;
    }

    navigate(nextUrl, { replace: true });
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    if (!twoFactorCode) {
      setError(
        language === 'km'
          ? 'សូមបញ្ចូលលេខកូដផ្ទៀងផ្ទាត់។'
          : 'Enter your authenticator or recovery code.'
      );
      return;
    }

    setSubmitting(true);
    setError('');
    const result = await verifyTwoFactor({
      challengeToken: twoFactorToken,
      code: twoFactorCode,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Invalid verification code.');
      return;
    }

    navigate(nextUrl, { replace: true });
  };

  const resetTwoFactor = () => {
    setTwoFactorToken(null);
    setTwoFactorCode('');
    setError('');
  };

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-bg">
      <div className="w-full max-w-md bg-surface border border-border p-8 sm:p-10 rounded-[var(--radius-modal)] shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          {twoFactorToken ? (
            <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
              <ShieldCheck className="w-6 h-6" />
            </div>
          ) : (
            <BrandLogo asLink={false} imgClassName="h-12 w-12 object-contain" />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-text tracking-tight">
            {twoFactorToken
              ? t('auth.twoFactorTitle', 'Two-Factor Verification')
              : t('auth.loginTitle', 'Resident Portal Sign In')}
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {twoFactorToken
              ? t(
                  'auth.twoFactorSubtitle',
                  'Enter the code from your authenticator app or a recovery code.'
                )
              : t(
                  'auth.loginSubtitle',
                  'Access your Solara reservations, preferences, and Gold Concierge privileges.'
                )}
          </p>
        </div>

        {registeredNotice && !error && !twoFactorToken && (
          <div className="p-3 rounded-[var(--radius-button)] bg-gold/10 border border-gold/30 text-xs text-text text-left">
            {t(
              'auth.registerSuccessSignIn',
              'Your account was created. Sign in with your email and password to continue.'
            )}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-[var(--radius-button)] bg-error/10 border border-error/30 text-xs text-error text-left">
            {error}
          </div>
        )}

        {twoFactorToken ? (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-4 text-left">
            <Input
              label={t('auth.twoFactorCode', 'Verification code')}
              required
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="123456"
              autoComplete="one-time-code"
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="gold"
              size="md"
              className="w-full shadow-md mt-2"
              disabled={submitting}
            >
              {submitting
                ? t('auth.verifying', 'Verifying…')
                : t('auth.verifyButton', 'Verify & Sign In')}
            </Button>

            <button
              type="button"
              onClick={resetTwoFactor}
              className="w-full text-xs text-muted hover:text-gold transition-colors cursor-pointer bg-transparent border-0"
            >
              {t('auth.backToSignIn', 'Back to email sign in')}
            </button>
          </form>
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

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-secondary">
                  {t('auth.password', 'Password')}
                </label>
                <Link
                  to={`/forgot-password?next=${encodeURIComponent(nextUrl)}`}
                  className="text-[11px] text-gold font-medium hover:underline"
                >
                  {t('auth.forgotPassword', 'Forgot password?')}
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="md"
              className="w-full shadow-md mt-2"
              disabled={submitting || authStatus === 'loading'}
            >
              {submitting
                ? t('auth.signingIn', 'Signing in…')
                : t('auth.signInButton', 'Sign In to Account')}
            </Button>
          </form>
        )}

        {!twoFactorToken && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted">
              {t('auth.newToSolara', 'New to Solara?')}{' '}
              <Link
                to={`/register?next=${encodeURIComponent(nextUrl)}`}
                className="text-gold font-medium hover:underline"
              >
                {t('auth.createProfile', 'Create Resident Profile')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
