-- Run this once in phpMyAdmin after importing crm (1).sql and
-- database/leads-opportunities-migration.sql.

ALTER TABLE leads
  MODIFY lead_status ENUM('New','Contacted','Qualified','Nurture','Disqualified','Converted') NOT NULL DEFAULT 'New',
  MODIFY disqualification_reason VARCHAR(255) NULL;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS demo_date DATE NULL,
  ADD COLUMN IF NOT EXISTS demo_time TIME NULL,
  ADD COLUMN IF NOT EXISTS demo_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS proposal_amount DECIMAL(12,2) NULL,
  ADD COLUMN IF NOT EXISTS proposal_sent_date DATE NULL,
  ADD COLUMN IF NOT EXISTS proposal_reference VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS proposal_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS negotiation_start_date DATE NULL,
  ADD COLUMN IF NOT EXISTS negotiation_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS closed_date DATE NULL,
  ADD COLUMN IF NOT EXISTS closed_amount DECIMAL(12,2) NULL,
  ADD COLUMN IF NOT EXISTS closed_notes TEXT NULL;

CREATE TABLE IF NOT EXISTS opportunity_activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  opportunity_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id INT(11) NULL,
  activity_type ENUM('created','stage_change','demo','proposal','negotiation','closed','lost','note') NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_opportunity_activities_opportunity (opportunity_id),
  CONSTRAINT fk_opportunity_activities_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
  CONSTRAINT fk_opportunity_activities_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
