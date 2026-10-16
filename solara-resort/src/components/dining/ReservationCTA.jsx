import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ReservationCTA({ t, addToast }) {
  const [date, setDate] = useState(todayIsoDate);
  const [time, setTime] = useState('19:30');
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [added, setAdded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAdded(true);
    addToast?.(
      t('dining.reservationCartSuccess', 'Table reservation saved to your cart for checkout.'),
      'success'
    );
  };

  return (
    <section id="table-reservation" className="py-16 sm:py-20 bg-primary text-white scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold leading-tight">
              {t('dining.reservationCtaTitle', 'Save a table for your evening')}
            </h2>
            <p className="text-sm text-white/85 font-light leading-relaxed max-w-md">
              {t(
                'dining.reservationCtaDesc',
                'Choose your date, time, and party size. We will hold your request while you complete checkout—no payment required until confirmation.'
              )}
            </p>
          </div>

          <div className="bg-white text-text rounded-[var(--radius-card)] p-6 sm:p-8 shadow-xl">
            {added ? (
              <div className="text-center space-y-3 py-4">
                <h3 className="text-xl font-serif font-bold text-text">
                  {t('dining.reservationCartAdded', 'Added to cart')}
                </h3>
                <p className="text-sm text-muted font-light">
                  {t(
                    'dining.reservationCartAddedDesc',
                    'Your table request is ready. Continue to checkout when you are ready to confirm.'
                  )}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted font-medium block">{t('common.date', 'Date')}</label>
                    <input
                      type="date"
                      value={date}
                      min={todayIsoDate()}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted font-medium block">{t('common.time', 'Time')}</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted font-medium block">{t('search.guests', 'Guests')}</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? t('search.guest', 'Guest') : t('search.guests', 'Guests')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted font-medium block">{t('activities.guestName', 'Guest Name')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted font-medium block">{t('activities.guestEmail', 'Guest Email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted font-medium block">{t('activities.guestPhone', 'Guest Phone')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] p-2 text-xs focus:outline-none focus:border-gold"
                    autoComplete="tel"
                  />
                </div>
                <Button type="submit" variant="primary" size="md" className="w-full">
                  {t('dining.addToCart', 'Add to cart')}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
