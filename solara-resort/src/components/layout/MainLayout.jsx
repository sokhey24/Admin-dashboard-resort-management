import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { ToastContainer } from '../toast/ToastContainer.jsx';
import { GeminiAssistantWidget } from '../ai/GeminiAssistantWidget.jsx';
import { PageTransition } from '../motion/PageTransition.jsx';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text selection:bg-gold/20 selection:text-gold-light">
      <Navbar />
      <main className="flex-1 w-full">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <ToastContainer />
      <GeminiAssistantWidget />
    </div>
  );
};
