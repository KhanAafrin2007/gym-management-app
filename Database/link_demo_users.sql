-- =====================================================================
-- RUN THIS ONLY AFTER you have created three users in
-- Supabase > Authentication > Users > Add user > Create new user
-- (tick "Auto Confirm User"):
--     admin@gym.com     trainer@gym.com     member@gym.com
-- Each new login automatically gets a 'pending' row in app_users.
-- This script gives each one its real role.
-- =====================================================================

update app_users set role = 'admin'                          where email = 'admin@gym.com';
update app_users set role = 'employee', trainer_id = 'T01'   where email = 'trainer@gym.com';
update app_users set role = 'member',   member_id  = 'M001'  where email = 'member@gym.com';

-- Check: you should see 3 rows with roles admin / employee / member
select email, role, member_id, trainer_id from app_users order by role;
