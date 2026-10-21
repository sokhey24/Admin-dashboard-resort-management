import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { BrandLogo } from '../../components/brand/BrandLogo.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { resolveSafeInternalPath } from '../../util/safeRedirect.js';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = resolveSafeInternalPath(searchParams.get('next'));

  const { registerAccount, user, authStatus, t, language } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      navigate(nextUrl, { replace: true });
    }
  }, [user, authStatus, navigate, nextUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError(
        language === 'km'
          ? 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់។'
          : 'Please complete all mandatory profile fields.'
      );
      return;
    }
    if (password.length < 8) {
      setError(
        language === 'km'
          ? 'ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងហោចណាស់ ៨ តួអក្សរ។'
          : 'Password must be at least 8 characters.'
      );
      return;
    }
    if (password !== passwordConfirm) {
      setError(
        language === 'km' ? 'ពាក្យសម្ងាត់មិនត្រូវគ្នា។' : 'Passwords do not match.'
      );
      return;
    }
    if (!agree) {
      setError(
        language === 'km'
          ? 'សូមយល់ព្រមតាមលក្ខខណ្ឌបដិសណ្ឋារកិច្ច។'
          : 'Please accept Solara terms of hospitality.'
      );
      return;
    }

    setSubmitting(true);
    setError('');
    setFieldErrors({});
    const result = await registerAccount({
      name,
      email,
      phone,
      password,
      password_confirmation: passwordConfirm,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.fieldErrors || {});
      setError(result.error || 'Unable to create account.');
      return;
    }

    const afterLogin = '/';
    navigate(`/login?next=${encodeURIComponent(afterLogin)}`, {
      replace: true,
      state: { email: result.email ?? email, registered: true },
    });
  };

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-bg">
      <div className="w-full max-w-md bg-surface border border-border p-8 sm:p-10 rounded-[var(--radius-modal)] shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo asLink={false} imgClassName="h-12 w-12 object-contain" />
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-text tracking-tight">
            {t('auth.registerTitle', 'Join the Solara Guild')}
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {t(
              'auth.registerSubtitle',
              'Register to unlock bespoke direct booking perks, personalized butler preferences, and exclusive rate tiers.'
            )}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-[var(--radius-button)] bg-error/10 border border-error/30 text-xs text-error text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label={t('contact.fullName', 'Full Name')}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sokhy Vann"
            autoComplete="name"
            error={fieldErrors.name}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label={t('auth.email', 'Email Address')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="resident@example.com"
            autoComplete="email"
            error={fieldErrors.email}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label={t('contact.phone', 'Phone Number')}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+855 12 345 678"
            autoComplete="tel"
            error={fieldErrors.phone}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label={t('auth.password', 'Password')}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            error={fieldErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Input
            label={t('auth.confirmPassword', 'Confirm password')}
            type="password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            error={fieldErrors.password_confirmation}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 accent-gold"
            />
            <label htmlFor="terms" className="text-[11px] text-muted leading-tight cursor-pointer">
              {t('auth.termsAgree', 'I agree to the Solara Terms of Hospitality and Privacy Charter.')}
            </label>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="md"
            className="w-full shadow-md mt-2"
            disabled={submitting}
          >
            {submitting
              ? t('auth.creatingAccount', 'Creating account…')
              : t('auth.registerButton', 'Create Resident Account')}
          </Button>
        </form>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted">
            {t('auth.alreadyRegistered', 'Already registered?')}{' '}
            <Link
              to={`/login?next=${encodeURIComponent(nextUrl)}`}
              className="text-gold font-medium hover:underline"
            >
              {t('nav.signIn', 'Sign In to Account')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
