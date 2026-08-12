import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

function passwordMatchValidator(c: AbstractControl): ValidationErrors | null {
  return c.get('password')?.value === c.get('confirmPassword')?.value
    ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isLoading      = signal(false);
  readonly errorMessage   = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword   = signal(false);
  readonly showConfirm    = signal(false);

  readonly signupForm = this.fb.group(
    {
      fullName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  get fullNameCtrl() { return this.signupForm.get('fullName')!; }
  get emailCtrl()    { return this.signupForm.get('email')!; }
  get passwordCtrl() { return this.signupForm.get('password')!; }
  get confirmCtrl()  { return this.signupForm.get('confirmPassword')!; }

  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) { this.signupForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { fullName, email, password } = this.signupForm.value;
    const { error, requiresEmailConfirmation } =
      await this.authService.signup(email!, password!, fullName!);

    if (error) { this.errorMessage.set(this.mapError(error)); this.isLoading.set(false); return; }
    if (requiresEmailConfirmation) {
      this.successMessage.set('Account created! Check your email and click the confirmation link.');
      this.isLoading.set(false);
      return;
    }
    await this.router.navigate([this.authService.postLoginRoute()]);
  }

  private mapError(e: Error): string {
    const m = e.message.toLowerCase();
    if (m.includes('already registered')) return 'This email is already registered. Try logging in.';
    if (m.includes('password should be'))  return 'Password is too weak. Use at least 8 characters.';
    return e.message;
  }
}
