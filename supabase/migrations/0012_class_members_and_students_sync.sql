-- =========================================================
-- MIGRATION 0012: CLASS MEMBERS AND STUDENTS SYNC
-- Ensures class_members and students.class_id stay 100% in sync
-- =========================================================

-- 1. RLS for class_members
drop policy if exists "Instructors manage class members" on public.class_members;
create policy "Instructors manage class members"
  on public.class_members for all
  using (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.classes c
      where c.id = class_members.class_id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
  )
  with check (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.classes c
      where c.id = class_members.class_id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
  );

-- 2. Trigger to sync students.class_id to class_members automatically
create or replace function public.sync_student_class_members()
returns trigger language plpgsql security definer as $$
begin
  if NEW.class_id is not null then
    insert into public.class_members (class_id, student_id, joined_at)
    values (NEW.class_id, NEW.id, now())
    on conflict (class_id, student_id) do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_sync_student_class_members on public.students;
create trigger trg_sync_student_class_members
after insert or update of class_id on public.students
for each row execute function public.sync_student_class_members();

-- Backfill any existing students into class_members
insert into public.class_members (class_id, student_id, joined_at)
select class_id, id, now()
from public.students
where class_id is not null
on conflict (class_id, student_id) do nothing;
