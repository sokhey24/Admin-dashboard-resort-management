import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConciergeBell, Phone, Mail, MessageCircle } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';

export function BranchConciergeModal({ isOpen, onClose, branch, branchName }) {
  const navigate = useNavigate();
  const { t } = useApp();

  const phone = branch?.contactPhone;
  const email = branch?.contactEmail;
  const locationLabel = branch?.location || branch?.city || branchName || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={t('branches.conciergeModal.title', 'VIP Concierge')}
      subtitle={t(
        'branches.conciergeModal.subtitle',
        'Private inventory and bespoke villa requests are arranged by our guild.'
      )}
    >
      <div className="space-y-6 text-sm text-muted">
        <div className="flex items-start gap-4 p-4 rounded-[var(--radius-card)] bg-gold/5 border border-gold/25">
          <div className="w-12 h-12 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
            <ConciergeBell className="w-6 h-6 text-gold" />
          </div>
          <div>
            <p className="text-text font-serif font-semibold text-base mb-1">
              {branchName || t('branches.conciergeModal.sanctuary', 'Your sanctuary')}
            </p>
            {locationLabel && <p className="text-xs">{locationLabel}</p>}
            <p className="text-xs mt-2 leading-relaxed">
              {t(
                'branches.conciergeModal.body',
                'No quarters are open for instant booking right now. Our concierge team can secure releases, connecting villas, and celebration itineraries on your behalf.'
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 text-text hover:text-gold transition-colors"
            >
              <Phone className="w-4 h-4 text-gold shrink-0" />
              {phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-text hover:text-gold transition-colors truncate"
            >
              <Mail className="w-4 h-4 text-gold shrink-0" />
              {email}
            </a>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="gold"
            size="md"
            className="flex-1"
            leftIcon={<MessageCircle className="w-4 h-4" />}
            onClick={() => {
              onClose();
              navigate('/contact', {
                state: {
                  branchId: branch?.id,
                  branchName,
                  subject: t('branches.conciergeModal.inquirySubject', 'VIP stay inquiry'),
                },
              });
            }}
          >
            {t('branches.conciergeModal.cta', 'Message Concierge')}
          </Button>
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default BranchConciergeModal;
