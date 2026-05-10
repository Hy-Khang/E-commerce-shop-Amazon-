# User Profile Feature

## Purpose
Manage user profile information and shipping addresses. Users can view/update their own profile (full_name, phone) and CRUD their shipping addresses with default selection.

## Owned Entities
- `addresses` — shipping addresses with default selection

## Dependencies
- **AuthModule** — injects `AuthService` for reading/updating user profile (since `users` entity is owned by auth)

## Endpoints
- `GET /users/me` — get current user profile
- `PATCH /users/me` — update profile (full_name, phone)
- `GET /addresses` — list user's addresses
- `POST /addresses` — create address
- `PATCH /addresses/:id` — update address
- `DELETE /addresses/:id` — delete address
- `PATCH /addresses/:id/default` — set as default

## Key Decisions
- Profile read/update delegates to AuthService since users entity is auth-owned
- Setting default address clears all existing defaults first (only one default per user)
- Addresses ordered by is_default DESC, id ASC
