import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Enforces authentic user session via Supabase Auth.
 * Redirects unauthenticated requests to /auth/login with returnUrl query parameter.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  try {
    const { data: { session } } = await supabase.client.auth.getSession();
    if (session && session.user) {
      return true;
    }
  } catch {
    // Session retrieval error -> block navigation
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
