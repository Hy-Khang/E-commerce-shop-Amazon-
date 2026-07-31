import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { queryClient } from './query-client';
import { ToastProvider } from '@/common/components/feedback/toast';
import { useRealtimeNotifications } from '@/features/notification';

function RealtimeLayer() {
  useRealtimeNotifications();
  return null;
}

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeLayer />
      {children}
      <ToastProvider />
    </QueryClientProvider>
  );
}
