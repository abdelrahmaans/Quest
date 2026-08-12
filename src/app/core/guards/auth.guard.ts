import { type CanActivateFn } from '@angular/router';

/**
 * Temporary Dev Testing Bypass: Always allows access to all routes.
 * Will be restored after user testing.
 */
export const authGuard: CanActivateFn = () => {
  return true;
};
