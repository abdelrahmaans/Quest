// TEMP-TESTING: Temporary Auth Bypass Configuration for Manual Testing
import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserRole } from '../models/role.enum';

/**
 * TEMP-TESTING: Set to true during internal dev testing to bypass login screens.
 * Must default to false. Impossible to run in production build (gated by !environment.production).
 */
export const TEMP_TESTING_BYPASS_AUTH = false;

// TEMP-TESTING: Active mock role for testing ('instructor' | 'admin')
export const tempTestingRole = signal<UserRole>(UserRole.INSTRUCTOR);

// TEMP-TESTING: Helper function to determine if bypass mode is currently active
export function isAuthBypassActive(): boolean {
  // TEMP-TESTING: Gate behind !environment.production + flag to ensure production safety
  return !environment.production && TEMP_TESTING_BYPASS_AUTH;
}
