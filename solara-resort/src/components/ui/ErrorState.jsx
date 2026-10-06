import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button.jsx';
import { FadeIn } from '../motion/FadeIn.jsx';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error while loading the resort catalog. Please try again.',
  onRetry,
  retryText = 'Try Again',
}) => {
  return (
    <FadeIn y={8} className="w-full text-center py-16 px-4 bg-surface/50 border border-error/20 rounded-[var(--radius-card)] my-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center text-error">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-text mb-2 font-serif">{title}</h3>
      <p className="text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          {retryText}
        </Button>
      )}
    </FadeIn>
  );
};
