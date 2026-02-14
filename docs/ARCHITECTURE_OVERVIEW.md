# Architecture Overview

## Frontend
- React + TypeScript + Vite SPA
- Route-level code splitting with `React.lazy` and `Suspense`
- shadcn/ui component system for reusable primitives

## Backend
- Supabase Postgres with RLS
- Supabase Edge Functions for privileged operations:
  - `create-showroom`
  - `send-order-email`

## Roles and Access
- `customer`, `showroom`, `admin`
- Role checks primarily via `public.has_role(...)`

## Key Domain Flows
- Catalog browsing and product detail
- Cart and checkout
- Order history/tracking
- Admin order/product/showroom operations

## Current phase hardening
- Deterministic admin order-item hydration
- Order-history contract consistency fixes
- Email function authorization and ownership checks
