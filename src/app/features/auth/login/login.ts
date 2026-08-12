import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { IconName } from '../../../shared/ui/icon/icons.constants';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle';
import { LangToggleComponent } from '../../../shared/ui/lang-toggle';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, ThemeToggleComponent, LangToggleComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(I18nService);

  readonly features: { icon: IconName; label: string }[] = [
    { icon: 'zap',         label: 'XP System' },
    { icon: 'trophy',      label: 'Achievements' },
    { icon: 'target',      label: 'Challenges' },
    { icon: 'bar-chart-2', label: 'Leaderboard' },
    { icon: 'flame',       label: 'Streaks' },
  ];

  readonly isLoading      = signal(false);
  readonly isGoogleLoading = signal(false);
  readonly errorMessage   = signal<string | null>(null);
  readonly showPassword   = signal(false);

  readonly loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get emailCtrl()    { return this.loginForm.get('email')!; }
  get passwordCtrl() { return this.loginForm.get('password')!; }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    const { error } = await this.authService.login(email!, password!);

    if (error) {
      this.errorMessage.set(this.mapError(error));
      this.isLoading.set(false);
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    await this.router.navigateByUrl(returnUrl ?? this.authService.postLoginRoute());
  }

  async loginWithGoogle(): Promise<void> {
    this.isGoogleLoading.set(true);
    this.errorMessage.set(null);
    const { error } = await this.authService.loginWithGoogle();
    if (error) { this.errorMessage.set(error.message); this.isGoogleLoading.set(false); }
  }

  private mapError(error: Error): string {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials')) return this.i18n.t('error.invalid_creds');
    if (msg.includes('email not confirmed'))        return this.i18n.t('error.email_unconfirmed');
    if (msg.includes('too many requests'))          return this.i18n.t('error.too_many');
    return error.message;
  }
}
