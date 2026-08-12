-- =========================================================
-- MIGRATION 0004: MULTI-TENANCY RLS POLICIES & HELPER
-- Ensures multi-tenant data isolation by organization_id
-- =========================================================

-- Helper function to fetch the current user's organization_id
create or replace function public.get_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid();
$$;

-- Multi-Tenant RLS Policy on classes table
create policy "Tenant organization read classes"
  on public.classes for select
  using (
    organization_id is null
    or organization_id = get_user_org_id()
    or is_admin()
  );

-- Multi-Tenant RLS Policy on students table
create policy "Tenant organization read students"
  on public.students for select
  using (
    organization_id is null
    or organization_id = get_user_org_id()
    or is_admin()
  );
