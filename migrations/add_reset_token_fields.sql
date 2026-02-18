-- Add password reset fields to users table
-- Migration: add_reset_token_fields
-- Created at: 2026-02-18

-- Add reset_token column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);

-- Add reset_token_expires column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Create index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Comment on columns
COMMENT ON COLUMN users.reset_token IS 'Password reset token (UUID)';
COMMENT ON COLUMN users.reset_token_expires IS 'Expiration time for password reset token';
