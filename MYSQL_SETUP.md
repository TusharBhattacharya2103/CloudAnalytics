# MySQL connection setup

1. In phpMyAdmin, import `crm (1).sql` into a database named `crm`.
2. Run `database/leads-opportunities-migration.sql`, then `database/opportunity-stage-renames.sql`, then `database/mysql-live-integration.sql`, then `database/role-team-access.sql`. The stage rename migration is required for existing databases: it converts the old `L1 - Lead` and `L2 - Qualified` values to `L1 - Prospects` and `L2 - Opportunity`, and updates the database enum so the board can display and save those stages.
3. Create the first team, then assign existing users and promote the trusted account to SuperAdmin. For example:
   ```sql
   INSERT INTO teams (name) VALUES ('Sales Team A');
   UPDATE users SET role='super_admin', team_id=NULL WHERE email='owner@example.com';
   UPDATE users SET team_id=1 WHERE email<>'owner@example.com';
   ```
   Change the emails/team to match your CRM. SuperAdmin creates Admins and teams; Admins create Sales Executives in their own team.
4. Copy `.env.example` to `.env.local`, enter your MySQL connection values, and set a long random `AUTH_SECRET`. Do not commit `.env.local`.
5. Restart `npm run dev` after editing `.env.local`.

The application uses `/api/leads` and `/api/opportunities`. Login checks the bcrypt password in the `users` table. Roles are `super_admin`, `admin`, and `sales_executive`. SuperAdmin can access all CRM records, Admin can access records assigned to users in their team, and Sales Executive can access only records assigned to themselves. Public signup is disabled.
