# Sprint 11: Multi-Tenant Architecture & Auth Expansion

## Overview
In Sprint 11, we transitioned SchemaForge from an open, single-tenant internal tool to a secure, multi-tenant SaaS application. This foundational shift introduces proper user identity, data isolation, and stateless JWT-based authentication.

## Architectural Changes

### 1. Database Schema Updates (`V4__add_users_table.sql`)
- Created a new `users` table with `id` (UUID), `username` (UNIQUE), and `password` (BCrypt encoded).
- Altered the `migration_runs` table to include a `user_id` foreign key constraint linking back to the `users` table.

### 2. Spring Security & JWT Implementation
- **SecurityConfig**: Removed the hardcoded admin credentials. Implemented a stateless session policy (`SessionCreationPolicy.STATELESS`) and secured all `/api/v1/**` endpoints (excluding `/api/v1/auth/login` and `/api/v1/auth/register`).
- **JwtUtil**: Added token generation, validation, and claim extraction using `jjwt-api` with a 24-hour expiration window.
- **JwtAuthFilter**: A `OncePerRequestFilter` that intercepts all requests, extracts the Bearer token, validates it, and injects the authenticated user into the `SecurityContextHolder`.

### 3. Service Layer Data Isolation
- **AuthService**: Handles user registration (ensuring unique usernames and BCrypt password hashing) and login authentication. Returns JWT tokens upon success.
- **MigrationRunService**: Updated to automatically bind new `MigrationRun` entities to the currently authenticated user. All fetch operations (`getHistory`, `getMigrationRun`) now enforce strict data isolation, ensuring users can only access their own schema runs.
- **MigrationRunRepository**: Refactored JPA queries to include `userId` filters (`findByUserIdAndFileNameOrderByCreatedAtDesc`).

### 4. Frontend Authentication Context
- **AuthContext**: Introduced a React Context (`AuthContext.tsx`) to manage the JWT token lifecycle across the application, persisting it in `localStorage`.
- **ProtectedRoute**: Replaced the previous ad-hoc route protection with a robust `ProtectedRoute` component that automatically redirects unauthenticated users to `/login`.
- **Login/Register UI**: Enhanced the `Login.tsx` component to support an inline toggle for User Registration, communicating with the newly exposed `/api/v1/auth/register` endpoint.

## Conclusion
The application is now primed for enterprise readiness. With multi-tenant data isolation fully enforced at the repository level, SchemaForge can safely support multiple users and teams concurrently without cross-contamination of migration scripts or database metadata.
