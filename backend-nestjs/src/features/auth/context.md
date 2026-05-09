# Auth Feature

## Purpose
User authentication and authorization — registration, login, JWT token management, multi-device session control.

## Owned Entities
- `roles` — customer, admin (extensible: seller, moderator)
- `users` — shared entity referenced by order, review, cart, user-profile
- `refresh_tokens` — JWT refresh token storage with soft revoke, multi-device support

## Endpoints
- `POST /auth/register` — Public, creates customer account + returns token pair
- `POST /auth/login` — Public, validates credentials + returns token pair
- `POST /auth/refresh` — Public, rotates refresh token (revoke old, issue new)
- `POST /auth/logout` — Customer, revokes single refresh token
- `POST /auth/logout-all` — Customer, revokes all refresh tokens for user

## Key Decisions
- Access token (15min) uses JWT signed with HS256; payload: `{ sub, email, role }`
- Refresh token is a UUID v4, stored as SHA-256 hash — never stored in plain text
- Token rotation on refresh: old token revoked, new pair issued
- `is_revoked` soft revoke instead of hard delete for audit trail
- Passwords hashed with bcrypt (cost factor 10)
- Global `JwtAuthGuard` + `RolesGuard` registered via `APP_GUARD` in AuthModule

## Dependencies
None — auth is the foundational module.

## Consumed By
- user-profile, cart, order, review — all import AuthModule for user identity
