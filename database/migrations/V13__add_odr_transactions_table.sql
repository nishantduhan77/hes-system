-- ODR Transactions Table
CREATE TABLE odr_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE,
    meter_serial_number VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    odr_operation VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    request_time TIMESTAMPTZ NOT NULL,
    completion_time TIMESTAMPTZ,
    expiry_time TIMESTAMPTZ NOT NULL,
    data JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meter_serial_number) REFERENCES meters(meter_serial_number) ON DELETE CASCADE,
    CONSTRAINT valid_odr_status CHECK (
        status IN ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED')
    )
);

-- Indexes for better performance
CREATE INDEX idx_odr_transactions_transaction_id ON odr_transactions(transaction_id);
CREATE INDEX idx_odr_transactions_meter_serial ON odr_transactions(meter_serial_number);
CREATE INDEX idx_odr_transactions_status ON odr_transactions(status);
CREATE INDEX idx_odr_transactions_expiry_time ON odr_transactions(expiry_time);
CREATE INDEX idx_odr_transactions_request_time ON odr_transactions(request_time);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_odr_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER odr_transactions_updated_at_trigger
    BEFORE UPDATE ON odr_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_odr_transactions_updated_at();

-- Function to clean up expired transactions
CREATE OR REPLACE FUNCTION cleanup_expired_odr_transactions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM odr_transactions 
    WHERE expiry_time < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql; 