# Auth Feature

## Purpose
User authentication, authorization, and RBAC — registration, login, email verification (OTP), forgot/reset password, change/set password, OAuth (Google/Facebook), JWT token management, multi-device session control, permission-based access control.

## Owned Entities
- `roles` — customer, admin, seller, shipper (extensible). `is_system` flag protects system roles from deletion.
- `permissions` — `resource:action` pairs (e.g. `products:create`), 32 seeded permissions across 12 resources (including `shops`)
- `role_permissions` — junction table linking roles to permissions (dynamic RBAC)
- `users` — shared entity referenced by order, review, cart, user-profile. Includes email verification fields and password reset fields.
- `refresh_tokens` — JWT refresh token storage with soft revoke, multi-device support
- `user_auth_providers` — OAuth multi-provider linking (Google, Facebook). Each user can link multiple providers.
- `oauth_codes` — temporary one-time codes for secure OAuth callback exchange (SHA-256 hashed, 60s TTL)

## Endpoints

### Customer Auth
- `POST /auth/register` — Public, creates account + sends OTP email (no auto-login)
- `POST /auth/verify-email` — Public, verify email with 6-digit OTP → returns token pair
- `POST /auth/resend-verification` — Public, resend OTP (60s cooldown, max 5/hour)
- `POST /auth/login` — Public, validates credentials + returns token pair (requires `email_verified`)
- `POST /auth/refresh` — Public, rotates refresh token (revoke old, issue new)
- `POST /auth/forgot-password` — Public, sends reset email (silent on unknown email)
- `POST /auth/reset-password` — Public, reset password with token from email
- `POST /auth/change-password` — Customer, change password (local users with existing password)
- `POST /auth/set-password` — Customer, set password (OAuth users without password)
- `POST /auth/logout` — Customer, revokes single refresh token
- `POST /auth/logout-all` — Customer, revokes all refresh tokens for user

### OAuth
- `GET /auth/google` — Public, initiate Google OAuth redirect
- `GET /auth/google/callback` — Public, Google OAuth callback → redirect to frontend with code
- `GET /auth/facebook` — Public, initiate Facebook OAuth redirect
- `GET /auth/facebook/callback` — Public, Facebook OAuth callback → redirect to frontend with code
- `POST /auth/oauth/exchange` — Public, exchange one-time code for token pair

### Admin: User Management
- `GET /admin/users` — paginated user list with search, role, status filters
- `GET /admin/users/:id` — user detail with order/review counts
- `PATCH /admin/users/:id/activate` — toggle ban/unban
- `PATCH /admin/users/:id/role` — change user role

### Admin: Role Management
- `GET/POST/PATCH/DELETE /admin/roles` — role CRUD
- `GET /admin/roles/:id/permissions` — list role's permissions
- `PUT /admin/roles/:id/permissions` — sync (replace all) permissions for a role
- `POST /admin/roles/:id/permissions` — add permissions to role
- `DELETE /admin/roles/:id/permissions` — remove permissions from role

### Admin: Permission Management
- `GET /admin/permissions` — list all permissions (filter by `?resource=`)
- `GET /admin/permissions/:id` — get permission by ID
- `POST /admin/permissions` — create permission
- `PATCH /admin/permissions/:id` — update permission
- `DELETE /admin/permissions/:id` — delete permission (fails if assigned to roles)

## Key Decisions
- AuthModule uses `DynamicModule` pattern (`AuthModule.forRoot()`) — conditionally registers OAuth strategies based on env vars
- AuthModule is **global** (`global: true`) — all features receive AuthService, guards, permission cache without explicit imports
- Access token (15min) uses JWT signed with HS256; payload: `{ sub, roleId }`
- Refresh token is a UUID v4, stored as SHA-256 hash — never stored in plain text
- Token rotation on refresh: old token revoked, new pair issued
- `is_revoked` soft revoke instead of hard delete for audit trail
- Passwords hashed with bcrypt (cost factor 10). `password_hash` nullable for OAuth-only users.
- Email verification: 6-digit OTP, SHA-256 hashed, 5-min expiry, `crypto.timingSafeEqual()` comparison
- Password reset: `crypto.randomBytes(32).toString('base64url')`, SHA-256 hashed, 1-hour expiry
- OAuth callback: one-time code stored in DB (not memory), atomic find+delete prevents replay
- OAuth account linking: existing email → auto-link provider, no duplicate user created
- Permission cache: in-memory `Map<roleId, Set<string>>` with 60s TTL, abstract interface for future Redis swap
- Escalation prevention: cannot grant permissions you don't have, cannot modify your own role's permissions

## Dependencies
- `MailModule` (`core/mail/`) — sends verification OTP and password reset emails

## Consumed By
- All features — AuthModule is global, provides JwtAuthGuard + PermissionsGuard via APP_GUARD
- All admin and seller controllers use `@Permissions()` decorator for authorization
