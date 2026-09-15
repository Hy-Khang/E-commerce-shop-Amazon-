import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AiChatWidget } from '@/features/ai-chat';
import { CompareBar } from '@/features/compare';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Header />
      <main className="shop-container flex-1 py-6">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <AiChatWidget />
      <ScrollRestoration />
    </div>
  );
}
