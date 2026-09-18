// i18n public surface. Components/hooks import `useTranslation`/`Trans` directly
// from 'react-i18next'; this barrel exposes the configured instance + helpers.
export { default as i18n } from './config';
export { resolveApiErrorMessage } from './resolveApiErrorMessage';
export { useFormat } from './useFormat';
export { enumLabel, useEnumLabel, type EnumGroup } from './enumLabel';
export { LanguageSwitcher } from './LanguageSwitcher';
