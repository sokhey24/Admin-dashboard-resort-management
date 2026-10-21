import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders.jsx';
import { AppRouter } from './router.jsx';
import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary.jsx';

export default function App() {
  return (
    <AppProviders>
      <RouteErrorBoundary>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </RouteErrorBoundary>
    </AppProviders>
  );
}
