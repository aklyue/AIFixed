CREATE TABLE
    IF NOT EXISTS email_verifications (
        email VARCHAR(255) PRIMARY KEY,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL,
            created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

-- Индекс для ускорения фоновой очистки просроченных кодов
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications (expires_at);