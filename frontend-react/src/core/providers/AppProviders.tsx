import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { queryClient } from './query-client';
import { ToastProvider } from '@/common/components/feedback/toast';
import { useThemeSync } from '@/common/theme';
import { useRealtimeNotifications } from '@/features/notification';
import { useRealtimeChat } from '@/features/chat';

function RealtimeLayer() {
  useRealtimeNotifications();
  useRealtimeChat();
  return null;
}

function ThemeLayer() {
  useThemeSync();
  return null;
}

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeLayer />
      <RealtimeLayer />
      {children}
      <ToastProvider />
    </QueryClientProvider>
  );
}
