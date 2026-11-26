-- ============================================================
-- Hall Management System - Full Supabase PostgreSQL Schema
-- ============================================================

-- 1. Hall Students & Seat Assignments
create table if not exists public.hall_students (
  seat_key text primary key,
  name text not null,
  student_id text not null,
  dept text not null,
  phone text not null,
  blood text not null,
  district text not null,
  floor integer not null check (floor >= 1),
  room integer not null check (room >= 1),
  bed text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hall_students_room_bed
  on public.hall_students (room, bed);

create index if not exists idx_hall_students_student_id
  on public.hall_students (student_id);

-- 2. External Meal Students (No Hall Seat)
create table if not exists public.external_meal_students (
  member_key text primary key,
  name text not null,
  student_id text not null default 'External',
  dept text not null default 'Outside',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Meal Records (Status, Meals, Deposit)
create table if not exists public.meal_records (
  member_key text primary key,
  status text not null default 'ON' check (status in ('ON', 'OFF')),
  meals integer not null default 0 check (meals >= 0),
  deposit numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

-- 4. Daily Bazar Costs
create table if not exists public.meal_bazar_costs (
  id bigint primary key,
  entry_date date not null default current_date,
  item text not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_bazar_costs_entry_date
  on public.meal_bazar_costs (entry_date);

-- 5. Hall Fee Payments (Provost Only)
create table if not exists public.hall_fee_records (
  seat_key text primary key,
  joma numeric(12, 2) not null default 0 check (joma >= 0),
  updated_at timestamptz not null default now()
);

-- 6. Daily Meal Log (For Datewise Meal Graph)
create table if not exists public.daily_meal_log (
  log_date date primary key,
  meal_count integer not null default 0 check (meal_count >= 0),
  updated_at timestamptz not null default now()
);

-- 7. Global Hall & Meal Settings
create table if not exists public.hall_settings (
  id text primary key default 'main',
  stolen_meals integer not null default 0 check (stolen_meals >= 0),
  hall_fee_target numeric(12, 2) not null default 3000 check (hall_fee_target >= 0),
  meal_is_open boolean not null default true,
  meal_start_date text not null default '',
  meal_close_date text not null default '',
  manager_info jsonb,
  updated_at timestamptz not null default now()
);

insert into public.hall_settings (id)
values ('main')
on conflict (id) do nothing;

-- ============================================================
-- Automatic updated_at Trigger Function
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hall_students_updated_at on public.hall_students;
create trigger trg_hall_students_updated_at
before update on public.hall_students
for each row execute function public.set_updated_at();

drop trigger if exists trg_external_meal_students_updated_at on public.external_meal_students;
create trigger trg_external_meal_students_updated_at
before update on public.external_meal_students
for each row execute function public.set_updated_at();

drop trigger if exists trg_meal_records_updated_at on public.meal_records;
create trigger trg_meal_records_updated_at
before update on public.meal_records
for each row execute function public.set_updated_at();

drop trigger if exists trg_hall_fee_records_updated_at on public.hall_fee_records;
create trigger trg_hall_fee_records_updated_at
before update on public.hall_fee_records
for each row execute function public.set_updated_at();

drop trigger if exists trg_daily_meal_log_updated_at on public.daily_meal_log;
create trigger trg_daily_meal_log_updated_at
before update on public.daily_meal_log
for each row execute function public.set_updated_at();

drop trigger if exists trg_hall_settings_updated_at on public.hall_settings;
create trigger trg_hall_settings_updated_at
before update on public.hall_settings
for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================
alter table public.hall_students enable row level security;
alter table public.external_meal_students enable row level security;
alter table public.meal_records enable row level security;
alter table public.meal_bazar_costs enable row level security;
alter table public.hall_fee_records enable row level security;
alter table public.daily_meal_log enable row level security;
alter table public.hall_settings enable row level security;

-- Public read access for hall/meal sheets, bazar cost, graph & settings
drop policy if exists "Public read hall_students" on public.hall_students;
create policy "Public read hall_students"
on public.hall_students for select using (true);

drop policy if exists "Public read external_meal_students" on public.external_meal_students;
create policy "Public read external_meal_students"
on public.external_meal_students for select using (true);

drop policy if exists "Public read meal_records" on public.meal_records;
create policy "Public read meal_records"
on public.meal_records for select using (true);

drop policy if exists "Public read meal_bazar_costs" on public.meal_bazar_costs;
create policy "Public read meal_bazar_costs"
on public.meal_bazar_costs for select using (true);

drop policy if exists "Public read daily_meal_log" on public.daily_meal_log;
create policy "Public read daily_meal_log"
on public.daily_meal_log for select using (true);

drop policy if exists "Public read hall_settings" on public.hall_settings;
create policy "Public read hall_settings"
on public.hall_settings for select using (true);

-- Hall fee records: restrict public read; allow authenticated/service access
drop policy if exists "Restricted read hall_fee_records" on public.hall_fee_records;
create policy "Restricted read hall_fee_records"
on public.hall_fee_records for select
using (auth.role() in ('authenticated', 'service_role'));

-- Client write access (tighten with Supabase Auth / custom claims in production)
drop policy if exists "Allow write hall_students" on public.hall_students;
create policy "Allow write hall_students"
on public.hall_students for all using (true) with check (true);

drop policy if exists "Allow write external_meal_students" on public.external_meal_students;
create policy "Allow write external_meal_students"
on public.external_meal_students for all using (true) with check (true);

drop policy if exists "Allow write meal_records" on public.meal_records;
create policy "Allow write meal_records"
on public.meal_records for all using (true) with check (true);

drop policy if exists "Allow write meal_bazar_costs" on public.meal_bazar_costs;
create policy "Allow write meal_bazar_costs"
on public.meal_bazar_costs for all using (true) with check (true);

drop policy if exists "Allow write hall_fee_records" on public.hall_fee_records;
create policy "Allow write hall_fee_records"
on public.hall_fee_records for all using (true) with check (true);

drop policy if exists "Allow write daily_meal_log" on public.daily_meal_log;
create policy "Allow write daily_meal_log"
on public.daily_meal_log for all using (true) with check (true);

drop policy if exists "Allow write hall_settings" on public.hall_settings;
create policy "Allow write hall_settings"
on public.hall_settings for all using (true) with check (true);
