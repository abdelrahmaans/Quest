import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { UserRole } from '../models/role.enum';

/**
 * Enforces role-based access control (RBAC).
 * Verifies Supabase session and user profile role before granting access.
 * Redirects unauthorized requests to /auth/login.
 */
export const roleGuard = (requiredRoles: UserRole[]): CanActivateFn => {
  return async (_route, state) => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    try {
      const { data: { session } } = await supabase.client.auth.getSession();
      if (!session || !session.user) {
        return router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url },
        });
      }

      const { data: profile } = await supabase.client
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile && requiredRoles.includes(profile.role as UserRole)) {
        return true;
      }
    } catch {
      // Role check exception -> block navigation
    }

    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
  };
};
