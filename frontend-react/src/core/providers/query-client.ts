import { QueryClient, MutationCache } from '@tanstack/react-query';
import { showErrorToast } from '@/common/components/feedback/toast';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      suppressToast?: boolean;
    };
  }
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.options.meta?.suppressToast) return;
      showErrorToast(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
