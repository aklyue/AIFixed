-- Migration: generation_jobs table
-- Run after 001_create_email_verifications.sql

CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL DEFAULT 'quality',
    topic TEXT NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    theme_id VARCHAR(100) NOT NULL,
    source_files JSONB NOT NULL DEFAULT '[]',
    context TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    current_stage VARCHAR(30) NOT NULL DEFAULT 'analyze',
    stages JSONB NOT NULL DEFAULT '[]',
    progress INT NOT NULL DEFAULT 0,
    presentation_id UUID,
    pptx_file_id UUID,
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at DESC);