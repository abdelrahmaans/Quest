import { inject } from '@angular/core';
import { type HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

/**
 * HTTP Interceptor that attaches the Supabase JWT access token
 * as an Authorization Bearer header to outgoing HTTP requests.
 *
 * NOTE: Supabase client calls do NOT go through Angular's HttpClient —
 * they use the Supabase JS SDK directly. This interceptor is for any
 * external REST APIs or Edge Functions called via Angular's HttpClient.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const supabaseService = inject(SupabaseService);

  return from(supabaseService.client.auth.getSession()).pipe(
    switchMap(({ data }) => {
      const token = data.session?.access_token;

      if (token) {
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
        return next(authReq);
      }

      return next(req);
    }),
  );
};
