import React from 'react';
import { ServiceRow } from './ServiceRow.jsx';

export function ServiceList({
  services,
  localize,
  currency,
  labels,
  onInquire,
  onBookRoom,
}) {
  return (
    <div className="space-y-12">
      {services.map((rawSrv, idx) => {
        const srv = localize ? localize(rawSrv) : rawSrv;
        return (
          <ServiceRow
            key={rawSrv.id}
            service={rawSrv}
            display={srv}
            index={idx}
            currency={currency}
            signatureLabel={labels.signatureLabel}
            inquireLabel={labels.inquireLabel}
            bookLabel={labels.bookLabel}
            durationLabel={labels.durationLabel}
            fromLabel={labels.fromLabel}
            complimentaryLabel={labels.complimentaryLabel}
            onInquire={onInquire}
            onBookRoom={onBookRoom}
          />
        );
      })}
    </div>
  );
}
