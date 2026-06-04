import { Component, DestroyRef, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { RegisterDto } from '../../../core/models/auth.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register {
private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading = false;
  apiError = '';
  showPassword = false;

  registerForm = this.fb.group(
    {
      fullName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(200)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100)
      ]],
      confirmPassword: ['', Validators.required]
    },
    { validators: this.passwordMatchValidator }
  );

  passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;

    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get passwordStrength(): 'weak' | 'medium' | 'strong' {
    const password =
      this.registerForm.get('password')?.value ?? '';

    if (password.length < 6) return 'weak';

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 3) return 'strong';
    if (score >= 1) return 'medium';
    return 'weak';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.apiError = '';

    const dto: RegisterDto = {
      fullName: this.registerForm.value.fullName ?? '',
      email: this.registerForm.value.email ?? '',
      password: this.registerForm.value.password ?? ''
    };

    this.authService.register(dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/rooms']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.apiError = err.error?.message || 'Registration failed. Please try again.';
        }
      });
  }

  isInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  isValid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.valid && field?.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors) return '';

    const errors = field.errors;

    if (errors['required']) {
      const names: Record<string, string> = {
        fullName: 'Full name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password'
      };
      return `${names[fieldName] || fieldName} is required`;
    }

    if (errors['email'])
      return 'Please enter a valid email address';

    if (errors['minlength']) {
      const min = errors['minlength'].requiredLength;
      return `Must be at least ${min} characters`;
    }

    if (errors['maxlength']) {
      const max = errors['maxlength'].requiredLength;
      return `Cannot exceed ${max} characters`;
    }

    return 'Invalid value';
  }
}
