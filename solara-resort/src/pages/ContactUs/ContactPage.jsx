import React, { useState } from 'react';
import { HeroSection } from '../../components/ui/HeroSection.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';
import { Phone, Mail, Clock, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { useResorts } from '../../hooks/useCatalog.js';
import { Spinner } from '../../components/common/Spinner.jsx';
import { submitContactInquiry } from '../../services/api/contactApi.js';
import { getApiErrorMessage, getValidationFieldErrors } from '../../services/api/errors.js';
import { useWebsiteContent } from '../../hooks/useWebsiteContent.js';
import { resolveContactDetails } from '../../util/marketingContent.js';
import { SITE_CONTACT } from '../../constants/siteContact.js';

export const ContactPage = () => {
  const { addToast, t, localize, language } = useApp();
  const { grouped } = useWebsiteContent();
  const contact = React.useMemo(
    () => resolveContactDetails(grouped, { t, language, siteContact: SITE_CONTACT }),
    [grouped, t, language]
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { resorts, loading: resortsLoading } = useResorts({ per_page: 100 });
  const [resort, setResort] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const localizedResorts = resorts.map((r) => (localize ? localize(r) : r));

  React.useEffect(() => {
    if (!resort && localizedResorts.length > 0) {
      setResort(localizedResorts[0].name);
    }
  }, [localizedResorts, resort]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError('');
    setFieldErrors({});

    try {
      const result = await submitContactInquiry({
        guest_name: name.trim(),
        guest_email: email.trim(),
        guest_phone: phone.trim(),
        resort_name: resort,
        subject,
        message: message.trim(),
      });

      if (!result?.success) {
        setFormError(
          t('contact.submitFailed', 'Unable to send your message. Please try again.')
        );
        return;
      }

      addToast(t('contact.submitSuccess', 'Thank you. Your message has been received by our concierge team.'), 'success');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      const apiErrors = getValidationFieldErrors(err);
      if (Object.keys(apiErrors).length > 0) {
        const mapped = {};
        Object.entries(apiErrors).forEach(([key, message]) => {
          if (key === 'guest_name') mapped.name = message;
          else if (key === 'guest_email') mapped.email = message;
          else if (key === 'guest_phone') mapped.phone = message;
          else if (key === 'resort_name') mapped.resort = message;
          else mapped[key] = message;
        });
        setFieldErrors(mapped);
      }
      setFormError(
        getApiErrorMessage(
          err,
          t('contact.submitFailed', 'Unable to send your message. Please try again.')
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-24">
      <HeroSection
        image={MARKETING_IMAGES.hero}
        badge={language === 'km' ? 'ជំនួយការផ្ទាល់' : 'Direct Concierge'}
        title={t('contact.pageTitle', 'Connect with Solara Resorts')}
        subtitle={t('contact.pageSubtitle', 'Our worldwide reservation concierge and on-property butler teams are dedicated to curating your ideal Cambodian residency.')}
        heightClass="min-h-[440px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                {t('contact.directChannels', 'Direct Channels')}
              </span>
              <h2 className="text-2xl font-serif font-bold text-text">
                {language === 'km' ? 'ក្រុមជំនួយការកណ្តាល' : 'Central Concierge Guild'}
              </h2>
              <p className="text-xs text-muted leading-relaxed font-light">
                {language === 'km'
                  ? 'បម្រើសេវាកម្ម ២៤ ម៉ោងជារៀងរាល់ថ្ងៃ សម្រាប់ការកក់បន្ទប់ ការដឹកជញ្ជូន ឬការរៀបចំកញ្ចប់វិស្សមកាលពិសេស។'
                  : 'Available 24 hours daily for reservation assistance, private helicopter connections, or custom retreat planning.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border flex items-start gap-3.5">
                <Phone className="w-4 h-4 text-gold shrink-0 mt-1" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-semibold text-text block">{contact.phoneLabel}</span>
                  <a href={contact.phoneHref} className="text-muted hover:text-gold block">
                    {contact.phonePrimary}
                  </a>
                  {contact.phoneSecondary && (
                    <span className="text-muted block">{contact.phoneSecondary}</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border flex items-start gap-3.5">
                <Mail className="w-4 h-4 text-gold shrink-0 mt-1" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-semibold text-text block">{contact.emailLabel}</span>
                  <a href={contact.emailHref} className="text-muted hover:text-gold block">
                    {contact.emailPrimary}
                  </a>
                  {contact.emailSecondary && (
                    <span className="text-muted block">{contact.emailSecondary}</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border flex items-start gap-3.5">
                <Clock className="w-4 h-4 text-gold shrink-0 mt-1" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-semibold text-text block">{contact.hoursLabel}</span>
                  <span className="text-muted">{contact.hoursValue}</span>
                </div>
              </div>

              {(contact.facebookUrl || contact.telegramUrl || contact.instagramUrl) && (
                <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs space-y-2">
                  <span className="font-semibold text-text block">
                    {t('contact.social', 'Social & messaging')}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {contact.facebookUrl && (
                      <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                        Facebook
                      </a>
                    )}
                    {contact.telegramUrl && (
                      <a href={contact.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                        Telegram
                      </a>
                    )}
                    {contact.instagramUrl && (
                      <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text font-serif">
                {t('contact.sanctuaryProperties', 'Sanctuary Properties')}
              </h4>
              <div className="space-y-2 text-xs text-muted">
                {localizedResorts.map((r) => (
                  <div key={r.id} className="pb-2 border-b border-border/40">
                    <p className="font-semibold text-text">{r.name}</p>
                    <p className="text-[11px] text-muted">{r.location}</p>
                    <p className="text-[11px] text-gold">{r.contactPhone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-surface border border-border p-8 rounded-[var(--radius-card)] shadow-lg space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                {t('contact.sendInquiry', 'Send an Inquiry')}
              </span>
              <h3 className="text-2xl font-serif font-bold text-text">
                {language === 'km' ? 'ផ្ញើសំណើ ឬសំណួរមកកាន់យើង' : 'Direct Resident Inquiry Form'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {formError && (
                <p className="text-xs text-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('contact.fullName', 'Full Name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sokhy Vann"
                  required
                />
                <Input
                  label={t('contact.email', 'Email Address')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sokhyvann29@gmail.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('contact.phone', 'Telephone / WhatsApp')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                  required
                />
                <Select
                  label={t('contact.sanctuaryInterest', 'Sanctuary of Interest')}
                  value={resort}
                  onChange={(e) => setResort(e.target.value)}
                >
                  {localizedResorts.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Select
                label={t('contact.inquiryNature', 'Inquiry Nature')}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="general">{t('contact.generalInquiry', 'General Inquiry & Reservations')}</option>
                <option value="wedding">{t('contact.privateEvent', 'Weddings & Celebrations')}</option>
                <option value="corporate">{t('contact.corporateRetreat', 'Corporate Retreats')}</option>
                <option value="press">{t('contact.pressMedia', 'Press & Media Relations')}</option>
              </Select>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text">
                  {t('contact.message', 'Your Message or Special Inquiries')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  placeholder={language === 'km' ? 'សូមសរសេរសំណួរ ឬសំណើពិសេសរបស់អ្នកនៅទីនេះ...' : 'Please specify dates, party size, dietary requirements, or private villa preferences...'}
                  className="w-full rounded-[var(--radius-input)] bg-bg border border-border px-3.5 py-2.5 text-xs text-text placeholder:text-muted focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {t('contact.submitInquiry', 'Submit Guest Inquiry')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
