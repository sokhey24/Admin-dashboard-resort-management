import React from 'react';
import { SearchX } from 'lucide-react';
import { Button } from './Button.jsx';
import { FadeIn } from '../motion/FadeIn.jsx';

export const EmptyState = ({
  title = 'No resorts found',
  description = 'Try adjusting your destination, date range, or search filters to find available sanctuaries.',
  actionText = 'Clear Filters',
  onAction,
  icon,
}) => {
  return (
    <FadeIn className="w-full text-center py-16 px-4 bg-surface/50 border border-border/60 rounded-[var(--radius-card)] my-6">
      <FadeIn delay={0.06} y={8} className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface-hover flex items-center justify-center text-gold">
        {icon || <SearchX className="w-7 h-7" />}
      </FadeIn>
      <FadeIn delay={0.1} y={8}>
        <h3 className="text-lg font-semibold text-text mb-2 font-serif">{title}</h3>
      </FadeIn>
      <FadeIn delay={0.14} y={8}>
        <p className="text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">{description}</p>
      </FadeIn>
      {onAction && actionText && (
        <FadeIn delay={0.18} y={8}>
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </FadeIn>
      )}
    </FadeIn>
  );
};
