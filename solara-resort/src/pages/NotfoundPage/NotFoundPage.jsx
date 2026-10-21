import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { BrandLogo } from '../../components/brand/BrandLogo.jsx';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-32 pb-24 flex items-center justify-center px-4 bg-bg text-center">
      <div className="max-w-md w-full bg-surface border border-border p-10 rounded-[var(--radius-modal)] shadow-2xl space-y-6">
        <div className="flex justify-center">
          <BrandLogo asLink={false} imgClassName="h-14 w-14 object-contain" />
        </div>

        <div>
          <span className="text-4xl font-bold font-serif text-gold block mb-1">404</span>
          <h1 className="text-2xl font-serif font-bold text-text">Sanctuary Not Found</h1>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            The page you are looking for may have been moved, renamed, or is temporarily secluded.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="gold"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Return Home
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
