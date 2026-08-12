import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading      = signal(false);
  readonly errorMessage   = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailCtrl() { return this.forgotForm.get('email')!; }

  async onSubmit(): Promise<void> {
    if (this.forgotForm.invalid) { this.forgotForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { error } = await this.authService.resetPasswordForEmail(this.forgotForm.value.email!);
    this.isLoading.set(false);

    if (error) { this.errorMessage.set(error.message); return; }
    // Vague message — prevents email enumeration
    this.successMessage.set(
      'If an account exists for this email, you will receive a reset link shortly.',
    );
  }
}
