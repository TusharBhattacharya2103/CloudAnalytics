-- Run once against the existing CRM database to update current opportunities
-- and allow the renamed stages in the opportunities.stage enum.
ALTER TABLE opportunities
  MODIFY stage enum('L1 - Lead','L2 - Qualified','L1 - Prospects','L2 - Opportunity','L3 - Demo','L4 - Proposal','L5 - Negotiation','L6 - Closed','L7 - Lost') NOT NULL DEFAULT 'L1 - Prospects';

UPDATE opportunities SET stage='L1 - Prospects' WHERE stage='L1 - Lead';
UPDATE opportunities SET stage='L2 - Opportunity' WHERE stage='L2 - Qualified';
-- Older MySQL setups may have accepted unsupported ENUM writes as an empty value.
-- New opportunities and lead conversions start in L1, so restore those rows there.
UPDATE opportunities SET stage='L1 - Prospects' WHERE stage='';

ALTER TABLE opportunities
  MODIFY stage enum('L1 - Prospects','L2 - Opportunity','L3 - Demo','L4 - Proposal','L5 - Negotiation','L6 - Closed','L7 - Lost') NOT NULL DEFAULT 'L1 - Prospects';
