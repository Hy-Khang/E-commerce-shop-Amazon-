# Auth Feature

## Purpose
User authentication and authorization — registration, login, token management.

## Owned Entities
- `roles` — customer, admin (extensible)
- `users` — shared entity referenced by order, review, cart, user-profile
- `refresh_tokens` — JWT refresh token storage with soft revoke

## Dependencies
None — auth is the foundational module.

## Consumed By
- user-profile, cart, order, review — all import AuthModule for user identity
