ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_profiles_phone_verified ON profiles(phone_verified);