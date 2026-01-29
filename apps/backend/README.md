# Backend – CSV Import & Customer API

This backend service is responsible for:

- Importing very large CSV files (2GB+) without blocking the Node.js event loop
- Persisting import progress for resilience
- Exposing APIs for import status and customer CRUD

---

## Setup

1. Install dependencies

   ```
   pnpm install
   ```

2. Configure environment variables
   - DATABASE_URL
   - CSV_FILE_PATH

3. Run the server
   ```
   pnpm dev
   ```

---

## API Endpoints

### Import

- POST /import/sync
  Starts a CSV import. Rejects if an import is already running.

- GET /import/progress
  Returns latest import progress.

### Customers

- GET /customers
- GET /customers/:id
- POST /customers
- PATCH /customers/:id

## CSV Import Flow

1. Client triggers POST /import/sync
2. ImportState is created with status=RUNNING
3. CSV file is streamed using fs.createReadStream
4. Rows are parsed incrementally
5. Rows are accumulated into batches
6. Batches are inserted using Prisma createMany
7. Progress is persisted periodically
8. ImportState is marked COMPLETED when finished

### Import State Lifecycle

The CSV import process is represented by a persisted `ImportState` record
with the following lifecycle states:

- `IDLE` – No import has been started yet
- `RUNNING` – An import is currently in progress
- `COMPLETED` – The CSV file has been fully processed successfully
- `FAILED` – The import was interrupted due to an unrecoverable error

The import API enforces a single active import by rejecting new
`/import/sync` requests while the state is `RUNNING`.

## Failure Handling

- Import state is always persisted
- Partial progress is not lost on failure
- Duplicate customers are safely skipped
- Import state is marked FAILED on unhandled errors

## Performance Characteristics

- Streaming-based CSV parsing
- Bounded memory usage
- Batched database writes
- Rate-limited progress persistence
- Import locking prevents overload

---

### MongoDB Duplicate Handling Note

When using MongoDB, Prisma does not support `skipDuplicates` with `createMany`.
To ensure idempotent imports, duplicate records are detected and skipped
explicitly during batch insertion.

## Out of Scope / Not Implemented

- Authentication & authorization
- Horizontal scaling of import workers
- Distributed locking

---
