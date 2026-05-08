import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/core/providers/AppProviders';
import { ErrorBoundary } from '@/common/components/feedback/ErrorBoundary';
import { router } from '@/core/router/router';

function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
