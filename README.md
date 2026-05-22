# E-commerce-shop-Amazon-

# Backend - NestJS

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run start:dev

# Stop

# Prisma Setup

npx prisma generate
npx prisma db push

npm run migrate:dev -- -n CreateInitialDatabaseSchema
npm run migrate:prod -- -n CreateInitialDatabaseSchema

# Prisma Migration

# Start with Prisma (development only - NOT production!)
# This runs Prisma's auto-migration when server starts
npm run start:dev:prisma

# Run database migration
npm run migrate:dev

# Generate Prisma Client (always run after schema changes)
npm run prisma:generate

# Reset database (WIPE ALL DATA - use with caution!)
npm run migrate:reset

# Apply migration to production (manual process)
npm run migrate:prod
```

# Frontend - React

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Test
npm test
```
