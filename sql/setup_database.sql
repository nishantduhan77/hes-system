-- Drop database if exists (be careful with this in production!)
DROP DATABASE IF EXISTS hes;

-- Create database
CREATE DATABASE hes;

-- Connect to the database
\c hes;

-- Create extension for TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'hes_user') THEN
    CREATE USER hes_user WITH PASSWORD 'hes_password';
  END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hes TO hes_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hes_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hes_user;

-- Set search path
ALTER DATABASE hes SET search_path TO public; 