-- Migration 012: Create Admin Users Table
-- Epic 6, Story 6.5: Admin Dashboard Authentication
-- Purpose: Admin user authentication and role-based access control

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin users can view their own data
CREATE POLICY admin_users_view_own
  ON admin_users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- RLS Policy: Super admins can view all admin users
CREATE POLICY admin_users_super_admin_view_all
  ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
    )
  );

-- RLS Policy: Super admins can insert new admin users
CREATE POLICY admin_users_super_admin_insert
  ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
    )
  );

-- RLS Policy: Super admins can update admin users
CREATE POLICY admin_users_super_admin_update
  ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Seed initial super admin user
-- Password: Admin@2025 (bcrypt hash with salt rounds 10)
-- Generated using: bcrypt.hash('Admin@2025', 10)
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'admin@zyprus.com',
  '$2b$10$6jevI/iMGmPNRpODWpRli.Pt5lJj/XXEyAiVoPNWZv9gL8mZNZ.ee',
  'System Administrator',
  'super_admin'
)
ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON admin_users TO authenticated;
GRANT ALL ON admin_users TO service_role;

-- Add comment for documentation
COMMENT ON TABLE admin_users IS 'Admin users for dashboard access with role-based permissions';
COMMENT ON COLUMN admin_users.role IS 'User role: super_admin (full access), admin (standard access), viewer (read-only)';
COMMENT ON COLUMN admin_users.password_hash IS 'Bcrypt-hashed password (never store plain text)';
