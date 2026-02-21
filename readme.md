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
DATABASE_URL=postgresql://postgres:password@localhost:5432/merchant_analytics
NODE_ENV=development
LOG_LEVEL=info
```

| Variable       | Description                              |
| -------------- | ---------------------------------------- |
| `PORT`         | Port the API listens on. Must be `8080`. |
| `DATABASE_URL` | PostgreSQL connection string.            |
| `NODE_ENV`     | `development` or `production`.           |
| `LOG_LEVEL`    | One of `info`, `warn`, `error`, `debug`. |

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

### 4. Add CSV Data

Place all provided CSV files into the `data/` directory:

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

- CSV headers match the provided schema exactly.
- `amount` is numeric and stored as `NUMERIC` in PostgreSQL.
- KYC completion is identified by `product = 'KYC'` and `status = 'SUCCESS'`.
- CSV data is immutable and imported only once.

---

## Notes for Reviewers

- Data ingestion is batched and transactional.
- Queries are optimized with indexes.
- Business logic is separated from route handlers.
- Errors are handled centrally.
- Logs are structured and production-safe.
