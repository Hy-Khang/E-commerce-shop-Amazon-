# Auth Feature

## Purpose
User authentication, authorization, and RBAC — registration, login, JWT token management, multi-device session control, permission-based access control.

## Owned Entities
- `roles` — customer, admin, seller, shipper (extensible). `is_system` flag protects system roles from deletion.
- `permissions` — `resource:action` pairs (e.g. `products:create`), 32 seeded permissions across 12 resources (including `shops`)
- `role_permissions` — junction table linking roles to permissions (dynamic RBAC)
- `users` — shared entity referenced by order, review, cart, user-profile
- `refresh_tokens` — JWT refresh token storage with soft revoke, multi-device support

## Endpoints

### Customer Auth
- `POST /auth/register` — Public, creates customer account + returns token pair
- `POST /auth/login` — Public, validates credentials + returns token pair
- `POST /auth/refresh` — Public, rotates refresh token (revoke old, issue new)
- `POST /auth/logout` — Customer, revokes single refresh token
- `POST /auth/logout-all` — Customer, revokes all refresh tokens for user

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
- Access token (15min) uses JWT signed with HS256; payload: `{ sub, roleId }`
- Refresh token is a UUID v4, stored as SHA-256 hash — never stored in plain text
- Token rotation on refresh: old token revoked, new pair issued
- `is_revoked` soft revoke instead of hard delete for audit trail
- Passwords hashed with bcrypt (cost factor 10)
- Global `JwtAuthGuard` + `PermissionsGuard` registered via `APP_GUARD` in AuthModule
- Permission cache: in-memory `Map<roleId, Set<string>>` with 60s TTL, abstract interface for future Redis swap
- Escalation prevention: cannot grant permissions you don't have, cannot modify your own role's permissions

## Dependencies
None — auth is the foundational module.

## Consumed By
- user-profile, shop, cart, order, review, wishlist — all import AuthModule for user identity
- All admin and seller controllers use `@Permissions()` decorator for authorization
