import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Warn before leaving a page with unsaved form changes.
 * - In-app navigation: React Router `useBlocker` + a confirm dialog.
 * - Tab close / refresh / external navigation: the native `beforeunload` prompt.
 *
 * Requires a data router (the app uses `createBrowserRouter`).
 */
export function useUnsavedChangesPrompt(when: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    const leave = window.confirm('You have unsaved changes. Leave without saving?');
    if (leave) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);
}
