# User Profile Feature

## Purpose
User profile view/edit and shipping address CRUD with default address selection.

## Pages
- `ProfilePage` — display and edit full_name, phone
- `AddressListPage` — list, create, edit, delete addresses; set default

## API Dependencies
- `GET /users/me` — current user profile
- `PATCH /users/me` — update profile
- `GET /addresses` — list addresses
- `POST /addresses` — create address
- `PATCH /addresses/:id` — update address
- `DELETE /addresses/:id` — delete address
- `PATCH /addresses/:id/default` — set default

## State
- Server state via TanStack Query
- No Zustand store needed (profile data is user-scoped, not cross-feature)

## Cross-Feature
- Order feature reads addresses for checkout address selection
