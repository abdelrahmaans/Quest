import { UserRole } from './role.enum';

/**
 * Mirrors the public.profiles table in Supabase.
 * Columns match migration 0001 + organization_id from 0003.
 */
export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}
