# Application Running & Verification Guide
## Booking Platform REST API

---

## 1. Prerequisites
Ensure you have the following software installed on your host system:
- **Node.js**: v18.x or v20.x
- **npm**: v9.x or v10.x
- **Docker & Docker Compose**: (Optional, for PostgreSQL container runtimes)
- **Git**: For source versioning and repository controls

---

## 2. Installation & Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` configuration file with your database details. The application operates in two modes depending on your configuration:

   ### Option A: Zero-Setup SQLite (Easiest Local Dev)
   To run locally without setting up a database daemon:
   ```env
   DB_TYPE=better-sqlite3
   DB_DATABASE=database.sqlite
   ```

   ### Option B: PostgreSQL (Production Setup)
   To run with PostgreSQL (e.g., using Docker or a local database instance):
   ```env
   DB_TYPE=postgres
   DB_DATABASE=booking_platform
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   ```

---

## 3. Running the Application

### 3.1 Local Development Mode
Start the NestJS compilation server with active code watch monitoring:
```bash
npm run start:dev
```
- API Endpoint: `http://localhost:3000/api/v1`
- Swagger Docs UI: `http://localhost:3000/api/docs`

### 3.2 Production Build Mode
Compile TypeScript to optimized JavaScript files and run the server:
```bash
# Compile TS source code to dist/ folder
npm run build

# Start the compiled bundle
npm run start:prod
```

### 3.3 Running via Docker Compose
Build the optimized multi-stage Docker container and spin up both the NestJS API and PostgreSQL database services:
```bash
docker compose up --build
```
This maps:
- NestJS API: `http://localhost:3000`
- PostgreSQL: Port `5432`

---

## 4. Running Database Migrations
When using PostgreSQL, you can execute database schema updates:

```bash
# Run all outstanding schema migrations
npm run migration:run

# Revert the latest migration
npm run migration:revert
```
*Note: In PostgreSQL mode, migrations automatically run on application startup.*

---

## 5. Running Automated Tests
E2E integration tests are configured with database isolation, executing against distinct SQLite files (`test-app.sqlite` and `test-booking-flow.sqlite`) to prevent dirtying the local development database.

```bash
# Run unit test suites
npm run test

# Run E2E integration test suites
npm run test:e2e
```

---

## 6. Verification and Testing Flow (Step-by-Step)

Once the application is running, open the **Swagger UI** (`http://localhost:3000/api/docs` or your Render live URL `https://your-app.onrender.com/api/docs`) to test these core flows:

### Step 6.1: Administrator Authentication
1. Scroll to the **Authentication** section.
2. Open the `POST /api/v1/auth/register` endpoint, click **Try it out**, and submit a JSON payload with a test email and password.
3. Open the `POST /api/v1/auth/login` endpoint and submit the same credentials.
4. Copy the `accessToken` returned in the JSON response.
5. Scroll to the top of the Swagger page, click the **Authorize** button, paste the copied token in the input field, and click **Authorize**. You can now access protected endpoints.

### Step 6.2: Create a Service
1. Open the `POST /api/v1/services` endpoint.
2. Click **Try it out** and submit a JSON payload:
   ```json
   {
     "title": "Haircut & Beard Trim",
     "description": "Premium grooming service",
     "duration": 45,
     "price": 35.0
   }
   ```
3. Copy the returned service `id` from the response.

### Step 6.3: Create a Booking (Double-Booking Check)
1. Open the `POST /api/v1/bookings` endpoint (does not require authorization).
2. Click **Try it out** and submit a payload using the copied service `id`:
   ```json
   {
     "customerName": "John Doe",
     "customerEmail": "john@example.com",
     "customerPhone": "555-1234",
     "serviceId": "PASTE_YOUR_SERVICE_ID_HERE",
     "bookingDate": "2026-08-15",
     "bookingTime": "10:30",
     "notes": "First time customer"
   }
   ```
3. Ensure the booking succeeds with status `PENDING`.
4. Click **Execute** again to submit the exact same booking payload.
5. The application will block the request and return a `409 Conflict` status with the error code:
   ```json
   {
     "statusCode": 409,
     "message": "This service is already booked for 2026-08-15 at 10:30. Please choose another time slot.",
     "errorCode": "ERR_DUPLICATE_BOOKING"
   }
   ```

### Step 6.4: Check Request Correlation ID Trace
1. Open your browser inspector (F12) -> **Network** tab while executing any API request.
2. Click on the completed request and check the **Response Headers**.
3. You will see the custom `x-request-id` header:
   - `x-request-id`: `c7b744d0-4034-45aa-9cbf-4be3a8f4c022`
4. Inspect the application console logs. You will see that this matching request ID is appended to all logs generated during the request, allowing you to trace the execution flow.
