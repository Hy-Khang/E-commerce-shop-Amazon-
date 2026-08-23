import { useEffect, useState } from 'react';

// Parent-level fullscreen state: Esc to exit + lock body scroll while the map
// overlays the page. Pair with the in-map <MapFullscreenControl> button.
export function useMapFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  return { isFullscreen, toggle: () => setIsFullscreen((v) => !v) };
}
