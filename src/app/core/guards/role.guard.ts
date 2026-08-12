import { type CanActivateFn } from '@angular/router';
import { UserRole } from '../models/role.enum';

/**
 * Temporary Dev Testing Bypass: Always allows role access.
 * Will be restored after user testing.
 */
export const roleGuard = (_requiredRoles: UserRole[]): CanActivateFn => {
  return () => true;
};
