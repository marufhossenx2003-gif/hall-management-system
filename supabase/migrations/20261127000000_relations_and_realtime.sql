-- ============================================================
-- Migration: Add Relations, Constraints, and Realtime Publication
-- ============================================================

-- 1. Foreign Key between hall_fee_records and hall_students
ALTER TABLE public.hall_fee_records
  DROP CONSTRAINT IF EXISTS fk_hall_fee_records_student;

ALTER TABLE public.hall_fee_records
  ADD CONSTRAINT fk_hall_fee_records_student
  FOREIGN KEY (seat_key) REFERENCES public.hall_students(seat_key)
  ON UPDATE CASCADE ON DELETE CASCADE;

-- 2. Ensure RLS Policy allows reading fee records with anon key
ALTER POLICY "Restricted read hall_fee_records" ON public.hall_fee_records USING (true);

-- 3. Add all tables to supabase_realtime publication for cross-site live sync
ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.hall_students,
  public.external_meal_students,
  public.meal_records,
  public.meal_bazar_costs,
  public.hall_fee_records,
  public.daily_meal_log,
  public.hall_settings;
