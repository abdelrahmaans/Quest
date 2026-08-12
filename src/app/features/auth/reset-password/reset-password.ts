import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

function passwordMatchValidator(c: AbstractControl): ValidationErrors | null {
  return c.get('password')?.value === c.get('confirmPassword')?.value
    ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isLoading       = signal(false);
  readonly isSuccess       = signal(false);
  readonly errorMessage    = signal<string | null>(null);
  readonly showPassword    = signal(false);
  readonly showConfirm     = signal(false);
  readonly isValidSession  = signal(true);

  readonly resetForm = this.fb.group(
    {
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  get passwordCtrl() { return this.resetForm.get('password')!; }
  get confirmCtrl()  { return this.resetForm.get('confirmPassword')!; }

  ngOnInit(): void {
    if (!this.authService.currentUser()) {
      setTimeout(() => {
        if (!this.authService.currentUser()) this.isValidSession.set(false);
      }, 1500);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { error } = await this.authService.updatePassword(this.resetForm.value.password!);
    this.isLoading.set(false);

    if (error) { this.errorMessage.set(error.message); return; }
    this.isSuccess.set(true);
    setTimeout(() => this.router.navigate([this.authService.postLoginRoute()]), 2500);
  }
}
