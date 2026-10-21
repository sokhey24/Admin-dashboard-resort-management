import { useEffect, useState } from 'react';
import { fetchGuestFolio } from '../../services/api/folioApi.js';
import { getApiErrorMessage } from '../../services/api/errors.js';
import { formatCurrency } from '../../util/currency.js';

const VIEW_STATUSES = new Set(['confirmed', 'checked_in', 'checked_out', 'completed']);

export default function GuestLiveBill({ bookingApiId, bookingStatus, currency = 'USD', t = (k, d) => d }) {
  const [open, setOpen] = useState(false);
  const [folio, setFolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canView = bookingApiId && VIEW_STATUSES.has(bookingStatus);

  useEffect(() => {
    if (!open || !canView) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchGuestFolio(bookingApiId)
      .then((data) => {
        if (!cancelled) setFolio(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, t('account.folioLoadFailed', 'Unable to load your bill.')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, bookingApiId, canView, t]);

  if (!canView) return null;

  const totals = folio?.totals ?? {};

  return (
    <div className="w-full mt-2">
      <button
        type="button"
        className="text-xs font-semibold text-gold hover:underline cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? t('account.hideLiveBill', 'Hide live bill') : t('account.viewLiveBill', 'View live bill')}
      </button>
      {open && (
        <div className="mt-3 rounded-[var(--radius-button)] border border-border bg-surface/80 p-4 text-left text-xs space-y-3">
          {loading && <p className="text-muted">{t('account.loadingBill', 'Loading bill…')}</p>}
          {error && <p className="text-rose-400">{error}</p>}
          {folio && !loading && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted block">{t('account.lodging', 'Lodging')}</span>
                  <span className="font-semibold text-text">{formatCurrency(totals.lodging_total ?? 0, currency)}</span>
                </div>
                <div>
                  <span className="text-muted block">{t('account.incidentals', 'Incidentals')}</span>
                  <span className="font-semibold text-text">{formatCurrency(totals.incidentals_total ?? 0, currency)}</span>
                </div>
                <div>
                  <span className="text-muted block">{t('account.paid', 'Paid')}</span>
                  <span className="font-semibold text-text">{formatCurrency(totals.net_paid ?? 0, currency)}</span>
                </div>
                <div>
                  <span className="text-muted block">{t('account.balanceDue', 'Balance due')}</span>
                  <span className="font-semibold text-gold">{formatCurrency(totals.balance_due ?? 0, currency)}</span>
                </div>
              </div>
              {(folio.incidental_charges ?? []).filter((c) => !c.voided_at).length > 0 && (
                <ul className="space-y-1 border-t border-border pt-2">
                  {folio.incidental_charges
                    .filter((c) => !c.voided_at)
                    .map((c) => (
                      <li key={c.id} className="flex justify-between gap-2 text-muted">
                        <span>{c.description}</span>
                        <span className="text-text shrink-0">{formatCurrency(c.amount, currency)}</span>
                      </li>
                    ))}
                </ul>
              )}
              <p className="text-[10px] text-muted">{t('account.folioReadOnly', 'Charges are managed by resort staff. This view is read-only.')}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
