-- =====================================================================
-- GYM MANAGEMENT SYSTEM - SUPABASE (POSTGRES) SCRIPT
-- Run this ONCE in Supabase > SQL Editor > New query > paste all > Run.
-- Contents: 14 relations (from DA1/DA2) + app_users + audit_log,
--           triggers, views, role-based Row Level Security, sample data.
-- =====================================================================

-- ---------- 1. THE 14 RELATIONS ----------
create table batch (
  batch_id    varchar(10) primary key,
  batch_name  varchar(30) not null,
  capacity    integer check (capacity > 0),
  batch_time  varchar(20)
);

create table trainer (
  trainer_id     varchar(10) primary key,
  trainer_name   varchar(40) not null,
  trainer_phone  varchar(15) unique,
  salary         numeric(10,2) check (salary > 0),
  experience     integer,
  is_active      boolean not null default true      -- app addition: "remove" = deactivate
);

create table member (
  member_id   varchar(10) primary key,
  f_name      varchar(30) not null,
  l_name      varchar(30),
  gender      varchar(10) check (gender in ('Male','Female','Other')),
  dob         date,
  join_date   date default current_date,
  address     varchar(100),
  phone_no    varchar(15) unique not null,
  email       varchar(50) unique,
  batch_id    varchar(10) references batch(batch_id),
  trainer_id  varchar(10) references trainer(trainer_id),
  is_active   boolean not null default true          -- app addition: "remove" = deactivate
);

create table membership_plan (
  plan_id           varchar(10) primary key,
  plan_name         varchar(30) not null,
  plan_description  varchar(100),
  fee               numeric(10,2) check (fee > 0),
  duration          integer                          -- months
);

create table membership (
  membership_id  varchar(10) primary key,
  start_date     date not null,
  end_date       date,
  status         varchar(15) check (status in ('Active','Expired','Cancelled')),
  member_id      varchar(10) references member(member_id),
  plan_id        varchar(10) references membership_plan(plan_id),
  constraint chk_dates check (end_date >= start_date)
);

create table payment (
  payment_id      varchar(10) primary key,
  amount          numeric(10,2) check (amount > 0),
  payment_mode    varchar(15) check (payment_mode in ('Cash','Card','UPI','NetBanking')),
  payment_date    date default current_date,
  payment_status  varchar(15) check (payment_status in ('Completed','Pending','Failed','Refunded')),
  member_id       varchar(10) references member(member_id)
);

create table attendance (
  member_id        varchar(10) references member(member_id) on delete cascade,
  attendance_date  date,
  check_in_time    time,
  checkout_time    time,
  primary key (member_id, attendance_date)
);

create table feedback (
  feedback_id    varchar(10) primary key,
  feedback_date  date default current_date,
  ratings        integer check (ratings between 1 and 5),
  comments       varchar(200),
  member_id      varchar(10) references member(member_id)
);

create table equipment (
  equipment_id    varchar(10) primary key,
  equipment_name  varchar(40) not null,
  status          varchar(20) check (status in ('Working','Under Repair','Retired')),
  quality         varchar(15),
  purchase_date   date
);

create table equipment_maintenance (
  equipment_id      varchar(10) references equipment(equipment_id) on delete cascade,
  maintenance_date  date,
  description       varchar(100),
  cost              numeric(8,2) check (cost >= 0),
  status            varchar(15),
  primary key (equipment_id, maintenance_date)
);

create table fitness_program (
  program_id    varchar(10) primary key,
  program_type  varchar(10) check (program_type in ('Diet','Workout')),
  created_date  date default current_date,
  trainer_id    varchar(10) references trainer(trainer_id)
);

create table diet_plan (
  program_id  varchar(10) primary key references fitness_program(program_id) on delete cascade,
  diet_name   varchar(40),
  meal_type   varchar(20),
  meal        varchar(100),
  calories    integer
);

create table workout_plan (
  program_id        varchar(10) primary key references fitness_program(program_id) on delete cascade,
  workout_name      varchar(40),
  duration          integer,
  difficulty_level  varchar(15) check (difficulty_level in ('Beginner','Intermediate','Advanced'))
);

create table member_program (
  member_id      varchar(10) references member(member_id),
  program_id     varchar(10) references fitness_program(program_id),
  assigned_date  date default current_date,
  primary key (member_id, program_id)
);

-- ---------- 2. SUPPORTING TABLES FOR THE APP (not part of DA1 model) ----------
-- Links a Supabase login (auth.users) to a role and to a member/trainer row.
create table app_users (
  auth_user_id  uuid primary key references auth.users(id) on delete cascade,
  email         text,
  role          text not null default 'pending'
                check (role in ('admin','employee','member','pending')),
  member_id     varchar(10) references member(member_id),
  trainer_id    varchar(10) references trainer(trainer_id),
  created_at    timestamptz default now()
);

create table audit_log (
  id          bigserial primary key,
  table_name  text,
  action      text,
  row_data    jsonb,
  changed_by  uuid,
  changed_at  timestamptz default now()
);

-- ---------- 3. HELPER FUNCTIONS (who is the logged-in user?) ----------
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as
$$ select role from public.app_users where auth_user_id = auth.uid() $$;

create or replace function public.app_member_id() returns text
language sql stable security definer set search_path = public as
$$ select member_id from public.app_users where auth_user_id = auth.uid() $$;

create or replace function public.app_trainer_id() returns text
language sql stable security definer set search_path = public as
$$ select trainer_id from public.app_users where auth_user_id = auth.uid() $$;

-- Every new login automatically gets an app_users row with role 'pending'.
-- The admin (or the link script) then assigns the real role.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$ begin
  insert into public.app_users (auth_user_id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 4. TRIGGERS (PL/pgSQL versions of the DA2 PL/SQL ideas) ----------
-- 4a. Block invalid payment amount (DA2 program P3)
create or replace function public.check_payment() returns trigger
language plpgsql as
$$ begin
  if new.amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;
  return new;
end $$;

create trigger trg_check_payment
  before insert or update on payment
  for each row execute function public.check_payment();

-- 4b. Audit log: who changed what, and when
create or replace function public.log_change() returns trigger
language plpgsql security definer set search_path = public as
$$ begin
  if tg_op = 'DELETE' then
    insert into audit_log(table_name, action, row_data, changed_by)
    values (tg_table_name, tg_op, to_jsonb(old), auth.uid());
    return old;
  else
    insert into audit_log(table_name, action, row_data, changed_by)
    values (tg_table_name, tg_op, to_jsonb(new), auth.uid());
    return new;
  end if;
end $$;

create trigger audit_member     after insert or update or delete on member     for each row execute function public.log_change();
create trigger audit_trainer    after insert or update or delete on trainer    for each row execute function public.log_change();
create trigger audit_payment    after insert or update or delete on payment    for each row execute function public.log_change();
create trigger audit_membership after insert or update or delete on membership for each row execute function public.log_change();

-- 4c. Function: mark memberships whose end date has passed as Expired
create or replace function public.expire_memberships() returns integer
language plpgsql as
$$ declare n integer;
begin
  update membership set status = 'Expired'
   where status = 'Active' and end_date < current_date;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- 5. VIEWS (security_invoker = the viewer's own RLS rules apply) ----------
create view member_payment_summary with (security_invoker = true) as
  select m.member_id, m.f_name || ' ' || m.l_name as full_name,
         coalesce(sum(p.amount) filter (where p.payment_status = 'Completed'), 0) as total_paid
  from member m left join payment p on p.member_id = m.member_id
  group by m.member_id, m.f_name, m.l_name;

create view expiring_memberships with (security_invoker = true) as
  select ms.membership_id, m.member_id, m.f_name, m.l_name, mp.plan_name, ms.end_date,
         (ms.end_date - current_date) as days_left
  from membership ms
  join member m on m.member_id = ms.member_id
  join membership_plan mp on mp.plan_id = ms.plan_id
  where ms.status = 'Active' and ms.end_date <= current_date + 7;

-- ---------- 6. ROW LEVEL SECURITY ----------
do $$
declare t text;
begin
  -- turn RLS on everywhere
  foreach t in array array['batch','trainer','member','membership_plan','membership','payment',
      'attendance','feedback','equipment','equipment_maintenance','fitness_program','diet_plan',
      'workout_plan','member_program','app_users','audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- ADMIN: full access to the 14 relations; EMPLOYEE: read all
  foreach t in array array['batch','trainer','member','membership_plan','membership','payment',
      'attendance','feedback','equipment','equipment_maintenance','fitness_program','diet_plan',
      'workout_plan','member_program'] loop
    execute format('create policy admin_all on public.%I for all
                    using (public.app_role() = ''admin'') with check (public.app_role() = ''admin'')', t);
    execute format('create policy staff_read on public.%I for select
                    using (public.app_role() = ''employee'')', t);
  end loop;

  -- EMPLOYEE: may add and edit (never delete) in these tables
  foreach t in array array['attendance','payment','membership','member_program',
      'fitness_program','diet_plan','workout_plan','equipment_maintenance'] loop
    execute format('create policy staff_insert on public.%I for insert
                    with check (public.app_role() = ''employee'')', t);
    execute format('create policy staff_update on public.%I for update
                    using (public.app_role() = ''employee'') with check (public.app_role() = ''employee'')', t);
  end loop;
end $$;

-- employee may update equipment status (e.g. Working -> Under Repair)
create policy staff_update on equipment for update
  using (public.app_role() = 'employee') with check (public.app_role() = 'employee');

-- app_users: everyone reads their own row; admin manages all rows (assign roles)
create policy own_row   on app_users for select using (auth_user_id = auth.uid());
create policy admin_all on app_users for all
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- audit_log: admin can read; inserts happen only through the trigger
create policy admin_read on audit_log for select using (public.app_role() = 'admin');

-- MEMBER: sees only their own data
create policy own_row on member      for select using (public.app_role() = 'member' and member_id = public.app_member_id());
create policy own_row on membership  for select using (public.app_role() = 'member' and member_id = public.app_member_id());
create policy own_row on payment     for select using (public.app_role() = 'member' and member_id = public.app_member_id());
create policy own_row on attendance  for select using (public.app_role() = 'member' and member_id = public.app_member_id());
create policy own_row on feedback    for select using (public.app_role() = 'member' and member_id = public.app_member_id());
create policy own_row on member_program for select using (public.app_role() = 'member' and member_id = public.app_member_id());

-- MEMBER: public gym info (batches, trainers, plans)
create policy member_read on batch           for select using (public.app_role() = 'member');
create policy member_read on trainer         for select using (public.app_role() = 'member');
create policy member_read on membership_plan for select using (public.app_role() = 'member');

-- MEMBER: only the programs assigned to them
create policy own_row on fitness_program for select using (public.app_role() = 'member'
  and program_id in (select program_id from member_program where member_id = public.app_member_id()));
create policy own_row on diet_plan for select using (public.app_role() = 'member'
  and program_id in (select program_id from member_program where member_id = public.app_member_id()));
create policy own_row on workout_plan for select using (public.app_role() = 'member'
  and program_id in (select program_id from member_program where member_id = public.app_member_id()));

-- MEMBER: can submit feedback for themselves
create policy own_insert on feedback for insert
  with check (public.app_role() = 'member' and member_id = public.app_member_id());

-- MEMBER: can START a payment, but only as Pending and only for themselves.
-- A staff member (or admin) must confirm it -> Completed.
create policy own_insert on payment for insert
  with check (public.app_role() = 'member' and member_id = public.app_member_id()
              and payment_status = 'Pending');

-- ---------- 7. PERMISSIONS FOR THE SUPABASE API ROLES ----------
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ---------- 8. SAMPLE DATA (same data as DA2) ----------
insert into batch values
 ('B01','Morning Batch',30,'06:00-08:00'),
 ('B02','Evening Batch',25,'17:00-19:00'),
 ('B03','Afternoon Batch',20,'13:00-15:00'),
 ('B04','Night Batch',15,'20:00-21:30');

insert into trainer (trainer_id,trainer_name,trainer_phone,salary,experience) values
 ('T01','Vikram Shah','9820011111',45000,6),
 ('T02','Priya Menon','9820022222',38000,4),
 ('T03','Suresh Kumar','9820033333',42000,5),
 ('T04','Anita Desai','9820044444',40000,7),
 ('T05','Manoj Verma','9820055555',36000,3),
 ('T06','Kavya Nambiar','9820066666',37000,2);

insert into member (member_id,f_name,l_name,gender,dob,join_date,address,phone_no,email,batch_id,trainer_id) values
 ('M001','Arjun','Mehta','Male','1998-05-14','2024-01-10','12 MG Road, Vellore','9840012345','arjun.mehta@gmail.com','B01','T01'),
 ('M002','Sneha','Rao','Female','2000-11-02','2024-02-15','45 Anna Nagar, Chennai','9840023456','sneha.rao@gmail.com','B02','T02'),
 ('M003','Kabir','Singh','Male','1995-07-21','2024-03-01','8 Lake View, Vellore','9840034567','kabir.singh@gmail.com','B01','T01'),
 ('M004','Divya','Nair','Female','1999-09-09','2024-03-20','23 Park Street, Vellore','9840045678','divya.nair@gmail.com','B03','T03'),
 ('M005','Rohan','Iyer','Male','1997-12-30','2024-04-05','67 Hill Road, Vellore','9840056789','rohan.iyer@gmail.com','B02','T02'),
 ('M006','Meera','Pillai','Female','1996-03-18','2024-04-10','14 Green Avenue, Vellore','9840067890','meera.pillai@gmail.com','B04','T04'),
 ('M007','Aditya','Kapoor','Male','2001-01-25','2024-04-15','56 River Road, Vellore','9840078901','aditya.kapoor@gmail.com','B01','T01'),
 ('M008','Neha','Joshi','Female','1998-08-08','2024-05-01','29 Temple Street, Vellore','9840089012','neha.joshi@gmail.com','B03','T03'),
 ('M009','Karthik','Reddy','Male','1994-06-12','2024-05-10','71 Station Road, Vellore','9840090123','karthik.reddy@gmail.com','B04','T04'),
 ('M010','Ishita','Bose','Female','2002-02-14','2024-05-18','33 Market Street, Vellore','9840001234','ishita.bose@gmail.com','B02','T05');

insert into membership_plan values
 ('PL01','Monthly','Basic monthly access',1500,1),
 ('PL02','Quarterly','3-month access with diet plan',4000,3),
 ('PL03','Annual','Full year access with personal training',15000,12),
 ('PL04','Half-Yearly','6-month access with diet+workout plan',8000,6);

insert into membership values
 ('MS001','2024-01-10','2024-02-09','Active','M001','PL01'),
 ('MS002','2024-02-15','2024-05-14','Active','M002','PL02'),
 ('MS003','2024-03-01','2025-02-28','Active','M003','PL03'),
 ('MS004','2024-03-20','2024-04-19','Expired','M004','PL01'),
 ('MS005','2024-04-05','2024-07-04','Active','M005','PL02'),
 ('MS006','2024-04-10','2024-10-09','Active','M006','PL04'),
 ('MS007','2024-04-15','2024-05-14','Active','M007','PL01'),
 ('MS008','2024-05-01','2025-04-30','Active','M008','PL03'),
 ('MS009','2024-05-10','2024-11-09','Active','M009','PL04'),
 ('MS010','2024-05-18','2024-06-17','Active','M010','PL01');

insert into payment values
 ('PM001',1500,'Cash','2024-01-10','Completed','M001'),
 ('PM002',4000,'UPI','2024-02-15','Completed','M002'),
 ('PM003',15000,'Card','2024-03-01','Completed','M003'),
 ('PM004',1500,'Cash','2024-03-20','Completed','M004'),
 ('PM005',4000,'UPI','2024-04-05','Completed','M005'),
 ('PM006',8000,'Card','2024-04-10','Completed','M006'),
 ('PM007',1500,'Cash','2024-04-15','Completed','M007'),
 ('PM008',15000,'NetBanking','2024-05-01','Completed','M008'),
 ('PM009',8000,'UPI','2024-05-10','Completed','M009'),
 ('PM010',1500,'Cash','2024-05-18','Completed','M010'),
 ('PM011',1500,'Cash','2024-02-10','Completed','M001'),
 ('PM012',4000,'UPI','2024-05-15','Completed','M002');

insert into attendance values
 ('M001','2024-04-01','06:05','07:10'),
 ('M002','2024-04-01','17:10','18:20'),
 ('M003','2024-04-01','06:15','07:30'),
 ('M004','2024-04-02','13:05','14:00'),
 ('M005','2024-04-02','17:20','18:25'),
 ('M006','2024-04-11','20:05','21:15'),
 ('M007','2024-04-16','06:10','07:05'),
 ('M008','2024-05-02','13:10','14:20'),
 ('M009','2024-05-11','20:15','21:20'),
 ('M010','2024-05-19','17:05','18:10'),
 ('M001','2024-04-03','06:00','07:00'),
 ('M003','2024-04-04','06:20','07:25');

insert into feedback values
 ('FB001','2024-04-05',5,'Great trainers and clean equipment','M001'),
 ('FB002','2024-04-06',4,'Good ambience, could add more machines','M002'),
 ('FB003','2024-04-07',5,'Excellent diet guidance','M003'),
 ('FB004','2024-04-08',3,'Batch was too crowded','M004'),
 ('FB005','2024-04-09',4,'Friendly staff','M005'),
 ('FB006','2024-04-12',5,'Loved the night batch timing','M006'),
 ('FB007','2024-04-17',4,'Good progress tracking','M007'),
 ('FB008','2024-05-03',3,'Equipment queue was long','M008'),
 ('FB009','2024-05-12',5,'Excellent workout plan','M009'),
 ('FB010','2024-05-20',4,'Nice and clean facility','M010');

insert into equipment values
 ('EQ01','Treadmill','Working','Good','2023-01-15'),
 ('EQ02','Dumbbell Set','Working','Excellent','2023-02-10'),
 ('EQ03','Bench Press','Under Repair','Fair','2022-11-05'),
 ('EQ04','Rowing Machine','Working','Good','2023-06-20'),
 ('EQ05','Leg Press Machine','Working','Good','2023-08-12'),
 ('EQ06','Cycling Machine','Retired','Poor','2021-05-30'),
 ('EQ07','Kettlebell Set','Working','Good','2024-02-01');

insert into equipment_maintenance values
 ('EQ01','2024-01-05','Belt replacement',2000,'Completed'),
 ('EQ02','2024-02-10','Rust cleaning',500,'Completed'),
 ('EQ03','2024-03-15','Cable repair',3500,'In Progress'),
 ('EQ04','2024-03-25','Lubrication',800,'Completed'),
 ('EQ05','2024-04-05','Hydraulic check',1200,'Completed'),
 ('EQ06','2024-01-20','Motor inspection',1500,'Completed');

insert into fitness_program values
 ('FP01','Diet','2024-01-12','T01'),
 ('FP02','Workout','2024-01-12','T01'),
 ('FP03','Diet','2024-02-18','T02'),
 ('FP04','Workout','2024-03-05','T03'),
 ('FP05','Workout','2024-04-08','T02'),
 ('FP06','Diet','2024-04-11','T04'),
 ('FP07','Workout','2024-04-16','T01'),
 ('FP08','Diet','2024-05-02','T03'),
 ('FP09','Workout','2024-05-11','T04'),
 ('FP10','Diet','2024-05-19','T05');

insert into diet_plan values
 ('FP01','Weight Loss Diet','Breakfast','Oats + Fruits',350),
 ('FP03','Muscle Gain Diet','Dinner','Chicken + Rice + Veg',650),
 ('FP06','Balanced Diet','Lunch','Dal + Roti + Salad',500),
 ('FP08','Keto Diet','Breakfast','Eggs + Avocado',400),
 ('FP10','Low Carb Diet','Dinner','Grilled Fish + Veggies',450);

insert into workout_plan values
 ('FP02','Fat Burn Cardio',45,'Intermediate'),
 ('FP04','Strength Training',60,'Advanced'),
 ('FP05','Beginner Full Body',30,'Beginner'),
 ('FP07','HIIT Blast',40,'Advanced'),
 ('FP09','Core & Flexibility',35,'Beginner');

insert into member_program values
 ('M001','FP01','2024-01-12'),
 ('M001','FP02','2024-01-12'),
 ('M003','FP03','2024-02-20'),
 ('M004','FP04','2024-03-06'),
 ('M005','FP05','2024-04-09'),
 ('M006','FP06','2024-04-12'),
 ('M007','FP07','2024-04-17'),
 ('M008','FP08','2024-05-03'),
 ('M009','FP09','2024-05-12'),
 ('M010','FP10','2024-05-20');

-- ---------- 9. QUICK CHECK (should show 10 / 12 / 12 / 10) ----------
select (select count(*) from member) as members,
       (select count(*) from payment) as payments,
       (select count(*) from attendance) as attendance_rows,
       (select count(*) from feedback) as feedback_rows;
