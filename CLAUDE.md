# Project: Ecommerce Shop (Amazon-inspired)

## Overview
A full-featured e-commerce platform. Includes product catalog, user authentication, shopping cart, checkout, order management, and admin dashboard.

## Tech Stack
- **Frontend:** React 19 + Vite, TypeScript, TanStack Query v5, Zustand, Tailwind CSS v4, React Router v7, React Hook Form + Zod
- **Backend:** NestJS v11, TypeScript, TypeORM
- **Database:** SQL Server

## Structure
```
├── frontend-react/    → @frontend-react/CLAUDE.md
├── backend-nestjs/    → @backend-nestjs/CLAUDE.md
└── share-docs/        → Shared documentation
```

## Shared Docs
- @share-docs/API_SPEC.md — REST endpoints, request/response format, auth flow, error codes
- @share-docs/DATABASE.md — schema, entities, relationships, TypeORM patterns, migration rules

## Available Skills

### Project Setup
- `/init-base [backend|frontend]` - Setup project architecture & environment

### Database
- `/seed [feature|all]` - Create/run seed data for database (per-feature or all)

### Feature Development
- `/be-crud [feature]` - Generate backend CRUD (entity, controller, service, dto)
- `/fe-crud [feature]` - Generate frontend CRUD (pages, components, hooks)
- `/be-test [feature]` - Write backend tests (unit + integration)
- `/fe-test [feature]` - Write frontend tests (component + hook)