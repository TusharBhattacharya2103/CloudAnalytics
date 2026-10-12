-- Run once after the existing CRM and leads/opportunities migrations.
-- Existing `admin` accounts become Admins; existing `user` accounts become Sales Executives.
CREATE TABLE IF NOT EXISTS teams (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE users MODIFY role VARCHAR(32) NOT NULL DEFAULT 'sales_executive';
UPDATE users SET role='admin' WHERE LOWER(role)='admin';
UPDATE users SET role='sales_executive' WHERE LOWER(role) IN ('user','sales','sales executive','');
UPDATE users SET role='super_admin' WHERE LOWER(role) IN ('superadmin','super_admin');
ALTER TABLE users ADD COLUMN team_id INT NULL, ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD KEY idx_users_team_role (team_id, role),
  ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id);

-- Set up an initial team and assign existing non-SuperAdmin users before enabling
-- the app. Mark the first trusted account as SuperAdmin using its actual email:
-- UPDATE users SET role='super_admin', team_id=NULL WHERE email='owner@example.com';
-- UPDATE users SET team_id=1 WHERE role IN ('admin','sales_executive');
