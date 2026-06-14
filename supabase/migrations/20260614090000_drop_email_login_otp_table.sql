-- Drop email_login_otps table (migrated to Supabase Auth OTP).
-- This table is no longer needed as email OTP login now uses Supabase Auth
-- directly with shouldCreateUser: false, eliminating the need for custom
-- OTP generation, hashing, and storage.

drop table if exists public.email_login_otps;
