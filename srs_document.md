# Software Requirements Specification (SRS)
## Booking Platform REST API

---

## 1. Introduction

### 1.1 Purpose
This document provides a detailed Software Requirements Specification (SRS) for the Booking Platform REST API. It outlines the functional, non-functional, security, database, and system architecture requirements of the backend application.

### 1.2 Scope
The Booking Platform REST API is a backend service built using NestJS and TypeScript. It enables administrators to manage a catalog of services (such as salons, cleanings, or consultations) and allows public clients/customers to query services, create bookings, and cancel them. It includes advanced caching, security headers, dynamic rate limiting, and an event-driven design to ensure scalability, reliability, and security.

### 1.3 Definitions, Acronyms, and Abbreviations
- **JWT**: JSON Web Token, used for secure client-server authorization.
- **RTR**: Refresh Token Rotation, a security design where new access and refresh tokens are issued on every refresh event.
- **ALS**: AsyncLocalStorage, a Node.js utility used to propagate request context (such as correlation IDs) down the execution thread.
- **TTL**: Time To Live, specifying cache expiration durations.
- **E2E**: End-to-End integration testing.

---

## 2. Overall Description

### 2.1 Product Perspective
This system acts as a standalone REST API backend. It interfaces with a relational database (PostgreSQL in production/compose, SQLite for development/testing). Administrative interfaces and client frontends communicate with this service over HTTP/HTTPS.

### 2.2 Product Functions
- **User Authentication**: Admin registration, login with token rotation, refresh, and secure logouts.
- **Service Catalog Management**: Authenticated CRUD operations on services, public querying, and caching of active services.
- **Booking Management**: Public scheduling of time slots, double-booking prevention, status changes, and customer-facing cancellations.
- **Notifications**: Off-thread dispatching of notification tasks triggered by booking creations.

### 2.3 Operating Environment
- **Operating System**: Cross-platform (Windows, macOS, Linux).
- **Runtime**: Node.js (v18.x or v20.x).
- **Containerization**: Docker and Docker Compose.
- **Database**: PostgreSQL (v15+) or SQLite (`better-sqlite3`).

### 2.4 Design Constraints
- Single-point-of-failure mitigation via container healthchecks.
- State-transition rules enforce booking lifecycles (e.g., cancelled bookings cannot be completed).
- Network socket preservation under load via dynamic rate limiting.

---

## 3. System Features & Functional Requirements

### 3.1 Feature 1: User Authentication & Session Management
- **Registration**: Allows new administrators to sign up using email and password. Passwords must be securely hashed using bcrypt (10 rounds).
- **Login**: Verifies credentials and returns a short-lived Access Token (15-minute expiry) and a Refresh Token (7-day expiry).
- **Token Rotation**: On token refresh, the old refresh token is invalidated, and a new pair of tokens is generated. The hash of the active refresh token is stored in the database.
- **Logout**: Clears the refresh token hash from the database, immediately terminating the session.

### 3.2 Feature 2: Service Management
- **Administrative CRUD**: Only authenticated users with valid JWTs can create, update, or delete services.
- **Deactivation vs. Deletion**: The system uses soft deletes (`deletedAt` timestamp). A service cannot be soft-deleted if it has active (pending or confirmed) bookings.
- **Public Access**: Any unauthenticated client can retrieve the list of all services or inspect a specific service by ID.

### 3.3 Feature 3: Booking Management & Rules Engine
- **Public Booking**: Customers can schedule a booking without authentication. Required fields: `customerName`, `customerEmail`, `customerPhone`, `serviceId`, `bookingDate` (YYYY-MM-DD), and `bookingTime` (HH:MM).
- **Past-Date Validation**: Booking dates and times must occur in the future.
- **Double-Booking Blocker**: A service cannot be booked twice for the same date and time. This is enforced by active database checks and a partial unique database index excluding cancelled bookings.
- **Status Progression**: Bookings start as `PENDING`. Admins can update status to `CONFIRMED`, `COMPLETED`, or `CANCELLED`. Customers can cancel a booking, but a `CANCELLED` booking can never be completed.

---

## 4. Non-Functional & Quality Requirements

### 4.1 Security
- **Secure Headers**: Integrated `helmet` with custom Content Security Policy (CSP) configurations to protect against Cross-Site Scripting (XSS).
- **CORS Configuration**: Restricts origin domain parameters to prevent unauthorized cross-origin requests.
- **Dynamic Rate Limiting**: The system tracks requests by authenticated user IDs (or public IP addresses) and enforces a limit of 120 requests/minute for logged-in users and 30 requests/minute for public clients.

### 4.2 Performance & Scalability
- **In-Memory Caching**: Implements a `CacheService` to cache the public services list for 5 minutes. The cache is automatically cleared upon any service creation, modification, or soft-deletion to maintain data consistency.
- **Event-Driven Execution**: Emits `booking.created` events on successful booking scheduling. An asynchronous listener handles mock email dispatch notifications off the main execution thread to avoid network latency blocking client response times.

### 4.3 Observability & Traceability
- **Structured Logging**: Outputs log lines as JSON strings in production for log aggregators, and colorized pretty-logs in development.
- **Request Correlation**: Middleware injects a unique UUID (`x-request-id`) header into all incoming requests. Using `AsyncLocalStorage`, this correlation ID is appended to all internal log statements and returned in HTTP headers to trace execution flows.

---

## 5. System Interfaces

### 5.1 Software Interfaces
- **TypeORM**: Abstracted relational mapping database queries.
- **Swagger UI**: Interactive developer interface served at `/api/docs`.
- **Terminus Healthcheck**: Health probing endpoint served at `/api/v1/health`.

### 5.2 Communication Interfaces
- REST API communicating over HTTP/HTTPS.
- Payload responses serialized as standard application/json.
