import 'i18next';
import type { resources, defaultNS } from './resources';

// Module augmentation → compile-time key safety + autocomplete for t().
// Keys are typed off the EN resources (source of truth); VI may lag at runtime.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
