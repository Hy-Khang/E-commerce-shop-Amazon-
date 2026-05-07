# Backend: Ecommerce Shop (Amazon-inspired)

## Tech Stack
- Language: TypeScript (strict mode)
- Framework: NestJS v11
- ORM: TypeORM

## Documentation

### Must Read
- @docs/BE-PROJECT-RULES.md — naming conventions, code patterns (repository, guard, DTO), anti-patterns
- @docs/BE-ARCHITECTURE.md — folder structure, request flow, cross-feature dependencies, module map

### Reference
- @../share-docs/API_SPEC.md — REST endpoints, request/response format, auth flow, error codes
- @../share-docs/DATABASE.md — schema, entities, relationships, TypeORM patterns, migration rules

## Quick Reference

### Feature Location
`src/features/[name]/` - Each feature has `context.md`

### Error Code Prefix
`[FEATURE]_[NUMBER]` - e.g., AUTH_001, USER_001
