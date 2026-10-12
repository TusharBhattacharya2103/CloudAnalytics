-- Run against the existing `crm` database after importing crm (1).sql.
-- The current application uses browser storage for its demo data; this schema
-- prepares MySQL/MariaDB for a server-side integration.

ALTER TABLE leads
  ADD COLUMN opportunity_id varchar(64) NULL,
  ADD COLUMN converted_at datetime NULL;

CREATE TABLE opportunities (
  id varchar(64) NOT NULL,
  lead_id int(11) NULL,
  opportunity_name varchar(255) NOT NULL,
  company_name varchar(150) NOT NULL,
  contact_name varchar(201) NOT NULL,
  contact_email varchar(255) NOT NULL,
  contact_phone varchar(50) NULL,
  description text NULL,
  deal_value decimal(12,2) NOT NULL,
  expected_closing_date date NULL,
  lead_source varchar(100) NULL,
  priority enum('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium',
  stage enum('L1 - Prospects','L2 - Opportunity','L3 - Demo','L4 - Proposal','L5 - Negotiation','L6 - Closed','L7 - Lost') NOT NULL DEFAULT 'L1 - Prospects',
  assigned_user_id int(11) NULL,
  next_follow_up_date date NULL,
  next_follow_up_time time NULL,
  next_action varchar(255) NULL,
  follow_up_notes text NULL,
  lost_reason varchar(100) NULL,
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_opportunities_lead_id (lead_id),
  KEY idx_opportunities_stage (stage),
  KEY idx_opportunities_owner (assigned_user_id),
  CONSTRAINT fk_opportunities_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_opportunities_user FOREIGN KEY (assigned_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lead_activities (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  lead_id int(11) NOT NULL,
  user_id int(11) NULL,
  activity_type enum('created','call','email','note','status_change','converted') NOT NULL,
  message text NOT NULL,
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY idx_lead_activities_lead (lead_id),
  CONSTRAINT fk_lead_activities_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_lead_activities_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
