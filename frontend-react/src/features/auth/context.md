# Auth Feature

## Purpose
Handles user authentication: login, register, token refresh, logout, and logout all devices.

## Pages
- `LoginPage` — email + password form, redirects on success
- `RegisterPage` — registration form with validation

## API Dependencies
- `POST /auth/login` — returns token pair + user
- `POST /auth/register` — creates account, returns token pair
- `POST /auth/refresh` — refreshes access token (handled by axios interceptor)
- `POST /auth/logout` — revokes current refresh token
- `POST /auth/logout-all` — revokes all refresh tokens

## State
- `useAuthStore` (Zustand) — global: user, accessToken, isAuthenticated, login(), logout()
- Tokens persisted in localStorage, attached by axios request interceptor
- 401 responses trigger silent refresh via response interceptor

## Cross-Feature
- Other features read `useAuthStore` for auth state
- Cart triggers `POST /cart/merge` on login if guest session exists
