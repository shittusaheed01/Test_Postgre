-- Enable UUID support if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table only if you explicitly want clean re-runs during development
-- DROP TABLE IF EXISTS merchant_activities;

CREATE TABLE IF NOT EXISTS merchant_activities (
    event_id UUID PRIMARY KEY,

    merchant_id VARCHAR(20) NOT NULL,
    
    event_timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,

    product VARCHAR(20) NOT NULL CHECK (
        product IN (
            'POS',
            'AIRTIME',
            'BILLS',
            'CARD_PAYMENT',
            'SAVINGS',
            'MONIEBOOK',
            'KYC'
        )
    ),

    event_type VARCHAR(50) NOT NULL,

    amount NUMERIC(18,2) CHECK (amount >= 0),

    status VARCHAR(10) NOT NULL CHECK (
        status IN ('SUCCESS', 'FAILED', 'PENDING')
    ),

    channel VARCHAR(20) NOT NULL CHECK (
        channel IN ('POS', 'APP', 'USSD', 'WEB', 'OFFLINE')
    ),

    region VARCHAR(50) NOT NULL,

    merchant_tier VARCHAR(20) NOT NULL CHECK (
        merchant_tier IN ('STARTER', 'VERIFIED', 'PREMIUM')
    )
);

-- ==========================
-- Indexes for Analytics
-- ==========================

-- Speeds up monthly aggregation
CREATE INDEX IF NOT EXISTS idx_activities_event_timestamp
    ON merchant_activities (event_timestamp);

-- Used in distinct merchant counts and top merchant query
CREATE INDEX IF NOT EXISTS idx_activities_merchant_id
    ON merchant_activities (merchant_id);

-- Used in product analytics and failure rate queries
CREATE INDEX IF NOT EXISTS idx_activities_product
    ON merchant_activities (product);

-- Used in filtering SUCCESS / FAILED
CREATE INDEX IF NOT EXISTS idx_activities_status
    ON merchant_activities (status);

-- Helpful composite index for top merchant query
CREATE INDEX IF NOT EXISTS idx_activities_status_merchant
    ON merchant_activities (status, merchant_id);