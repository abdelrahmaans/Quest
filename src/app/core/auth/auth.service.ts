import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../services/supabase.service';
import { UserProfile } from '../models/user.model';
import { UserRole } from '../models/role.enum';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  // ─── Reactive State ──────────────────────────────────────────────────────
  readonly currentUser = signal<User | null>(null);
  readonly currentProfile = signal<UserProfile | null>(null);
  readonly currentRole = signal<UserRole | null>(null);
  readonly isLoading = signal<boolean>(true);

  constructor() {
    this.initAuthListener();
  }

  // ─── Auth State Listener ──────────────────────────────────────────────────
  private initAuthListener(): void {
    this.supabaseService.client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        this.currentUser.set(session.user);
        await this.loadProfile(session.user.id);
      } else {
        this.currentUser.set(null);
        this.currentProfile.set(null);
        this.currentRole.set(null);
      }
      this.isLoading.set(false);
    });
  }

  // ─── Profile Loader ───────────────────────────────────────────────────────
  private async loadProfile(userId: string, attempt = 1): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Profile may not exist yet — Supabase trigger runs async after signup.
      // Retry up to 3 times with backoff.
      if (attempt < 4) {
        await this.delay(attempt * 500);
        return this.loadProfile(userId, attempt + 1);
      }
      console.error('[MadaQuest] AuthService: failed to load profile after retries', error);
      return;
    }

    this.currentProfile.set(data as UserProfile);
    this.currentRole.set(data['role'] as UserRole);
  }

  // ─── Auth Operations ──────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  }

  async loginWithGoogle(): Promise<{ error: Error | null }> {
    const { error } = await this.supabaseService.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  }

  async signup(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ error: Error | null; requiresEmailConfirmation: boolean }> {
    const { data, error } = await this.supabaseService.client.auth.signUp({
      email,
      password,
      options: {
        // Role defaults to 'instructor' via the handle_new_user trigger (migration 0002).
        // Admin accounts are set manually in the DB — never from the signup form.
        data: { full_name: fullName, role: UserRole.INSTRUCTOR },
      },
    });

    const requiresEmailConfirmation =
      !error && data.user?.identities?.length === 0;

    return { error: error as Error | null, requiresEmailConfirmation };
  }

  async logout(): Promise<void> {
    await this.supabaseService.client.auth.signOut();
    await this.router.navigate(['/auth/login']);
  }

  async resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/reset-password` },
    );
    return { error: error as Error | null };
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabaseService.client.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  }

  // ─── Role Helpers ─────────────────────────────────────────────────────────

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.currentRole();
    return role !== null && roles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isInstructor(): boolean {
    return this.hasRole(UserRole.INSTRUCTOR);
  }

  /** Returns the route path the user should land on after login. */
  postLoginRoute(): string {
    return this.isAdmin() ? '/admin' : '/instructor';
  }

  // ─── Utility ─────────────────────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
