# Frontend: Ecommerce Shop (Amazon-inspired)

## Tech Stack
- Framework: React 19 + Vite
- Language: TypeScript (strict mode)
- State: Zustand (global client state), TanStack Query v5 (server state)
- Styling: Tailwind CSS v4
- HTTP: Axios (interceptors for JWT, refresh, error transform)
- Routing: React Router v7- Forms: React Hook Form + Zod
- Icons: Lucide React

## Documentation

### Must Read
- @docs/FE-PROJECT-RULES.md — naming conventions, component rules, TanStack Query patterns, anti-patterns
- @docs/FE-ARCHITECTURE.md — folder structure, data flow, routing, state management strategy
- @docs/DESIGN.md — design system: color tokens, typography, component patterns, border/z-index scale (read before any UI styling)

### Reference
- @../share-docs/API_SPEC.md — REST endpoints, request/response format, auth flow, error codes

## Quick Reference

### Feature Location
`src/features/[name]/` - Each feature has `context.md`

### Public Exports
Always via `index` file (barrel export)
