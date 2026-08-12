import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { isAuthBypassActive } from '../config/temp-testing.flag'; // TEMP-TESTING: import bypass checker

/**
 * Protects routes that require a logged-in user.
 * Redirects unauthenticated users to /auth/login,
 * preserving the original URL as a returnUrl query param.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  // TEMP-TESTING: Allow access if testing bypass is active
  if (isAuthBypassActive()) {
    return true; // TEMP-TESTING: bypass auth requirement
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
