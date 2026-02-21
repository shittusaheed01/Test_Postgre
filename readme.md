# Merchant Analytics API

**DreamDev Hackathon 2025** · Author: Saheed Shittu

A REST API service that ingests merchant activity CSV files into PostgreSQL and exposes analytics endpoints over HTTP.

---

## Overview

- Imports merchant activity data from CSV files into PostgreSQL on first startup
- Runs analytics queries directly from the database
- Exposes 5 analytics endpoints over HTTP
- Runs on port `8080` as required

---

## Prerequisites

Ensure the following are installed before proceeding:

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** (bundled with Node.js)

---

## Project Structure

```
.
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── db/
│   ├── routes/
│   ├── services/
│   └── utils/
├── data/
│   ├── activities_20240101.csv
│   ├── activities_20240102.csv
│   └── ...
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in the project root with the following values:

```env
PORT=8080
NODE_ENV=development
LOG_LEVEL=info

DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=merchant_analytics
DB_PORT=5432
DB_SSL=false
```

| Variable      | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `PORT`        | Port the API listens on. Must be `8080`.                        |
| `NODE_ENV`    | `development` or `production`.                                  |
| `LOG_LEVEL`   | One of `info`, `warn`, `error`, `debug`.                        |
| `DB_HOST`     | PostgreSQL host.                                                |
| `DB_USER`     | PostgreSQL user.                                                |
| `DB_PASSWORD` | PostgreSQL password.                                            |
| `DB_NAME`     | Name of the database.                                           |
| `DB_PORT`     | PostgreSQL port. Defaults to `5432` if not set.                 |
| `DB_SSL`      | Set to `true` to enable SSL (uses `rejectUnauthorized: false`). |

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create the Database

```bash
createdb merchant_analytics
```

### 3. Run the Schema

```bash
psql merchant_analytics < src/db/schema.sql
```

This creates the `merchant_activities` table with the following columns:

| Column            | Type            | Notes                                                                    |
| ----------------- | --------------- | ------------------------------------------------------------------------ |
| `event_id`        | `UUID`          | Primary key                                                              |
| `merchant_id`     | `VARCHAR(20)`   | —                                                                        |
| `event_timestamp` | `TIMESTAMP`     | Without time zone                                                        |
| `product`         | `VARCHAR(20)`   | `POS`, `AIRTIME`, `BILLS`, `CARD_PAYMENT`, `SAVINGS`, `MONIEBOOK`, `KYC` |
| `event_type`      | `VARCHAR(50)`   | —                                                                        |
| `amount`          | `NUMERIC(18,2)` | Must be ≥ 0                                                              |
| `status`          | `VARCHAR(10)`   | `SUCCESS`, `FAILED`, `PENDING`                                           |
| `channel`         | `VARCHAR(20)`   | `POS`, `APP`, `USSD`, `WEB`, `OFFLINE`                                   |
| `region`          | `VARCHAR(50)`   | —                                                                        |
| `merchant_tier`   | `VARCHAR(20)`   | `STARTER`, `VERIFIED`, `PREMIUM`                                         |

Indexes are created automatically on `event_timestamp`, `merchant_id`, `product`, `status`, and a composite `(status, merchant_id)` to support all analytics queries.

### 4. Add CSV Data

Place all provided CSV files into the `data/` directory at the project root:

```
data/
└── activities_YYYYMMDD.csv
```

CSV files are imported automatically on first startup if the table is empty.

---

## Running the Application

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

The server will be available at `http://localhost:8080`.

---

## API Endpoints

All endpoints return JSON.

| Method | Endpoint                              |
| ------ | ------------------------------------- |
| `GET`  | `/analytics/top-merchant`             |
| `GET`  | `/analytics/monthly-active-merchants` |
| `GET`  | `/analytics/product-adoption`         |
| `GET`  | `/analytics/kyc-funnel`               |
| `GET`  | `/analytics/failure-rates`            |

**Example:**

```bash
curl http://localhost:8080/analytics/top-merchant
```

---

## Assumptions

- CSV headers match the schema column names exactly.
- `amount` is numeric and stored as `NUMERIC(18,2)` in PostgreSQL but if no amount is provided, it logs it and saves it as 0.
- if `event_timestamp` not provided, the entry is saved as the name of it's parent file + 5 hours, instead of leaving it as null.
- KYC completion is identified by `product = 'KYC'` and `status = 'SUCCESS'`.
- CSV data is immutable and imported only once.

---

## Notes for Reviewers

- Data ingestion is batched and transactional.
- Queries are optimized with indexes on all frequently filtered columns.
- Business logic is separated from route handlers.
- Errors are handled centrally.
- Logs are structured and production-safe.
