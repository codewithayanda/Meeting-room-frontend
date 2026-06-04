import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Register } from './register';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

const mockAuthResponse: AuthResponse = {
  token: 'tok',
  fullName: 'Jane Doe',
  email: 'jane@test.com',
  role: 'user',
  expiresAt: '2099-01-01',
};

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an invalid form', () => {
    expect(component.registerForm.invalid).toBeTrue();
  });

  it('should default showPassword to false', () => {
    expect(component.showPassword).toBeFalse();
  });

  describe('passwordMatchValidator', () => {
    it('should return passwordMismatch error when passwords differ', () => {
      component.registerForm.patchValue({ password: 'Password1!', confirmPassword: 'Different1!' });
      expect(component.registerForm.errors?.['passwordMismatch']).toBeTrue();
    });

    it('should return null when passwords match', () => {
      component.registerForm.patchValue({ password: 'Password1!', confirmPassword: 'Password1!' });
      expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
    });

    it('should return null when both password fields are empty', () => {
      expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
    });
  });

  describe('passwordStrength', () => {
    it('should return weak when password is shorter than 6 characters', () => {
      component.registerForm.get('password')?.setValue('abc');
      expect(component.passwordStrength).toBe('weak');
    });

    it('should return weak when password meets length but has no complexity', () => {
      component.registerForm.get('password')?.setValue('abcdef');
      expect(component.passwordStrength).toBe('weak');
    });

    it('should return medium when password has some complexity', () => {
      component.registerForm.get('password')?.setValue('abcdef1');
      expect(component.passwordStrength).toBe('medium');
    });

    it('should return strong when password has length, case, digit, and special char', () => {
      component.registerForm.get('password')?.setValue('Abcdef1!');
      expect(component.passwordStrength).toBe('strong');
    });
  });

  describe('togglePassword', () => {
    it('should toggle showPassword from false to true', () => {
      component.togglePassword();
      expect(component.showPassword).toBeTrue();
    });

    it('should toggle showPassword back to false on second call', () => {
      component.togglePassword();
      component.togglePassword();
      expect(component.showPassword).toBeFalse();
    });
  });

  describe('isInvalid / isValid', () => {
    it('should return false for an untouched invalid field', () => {
      expect(component.isInvalid('fullName')).toBeFalse();
    });

    it('should return true for a touched invalid field', () => {
      component.registerForm.get('fullName')?.markAsTouched();
      expect(component.isInvalid('fullName')).toBeTrue();
    });

    it('should return false for isValid on an untouched valid field', () => {
      component.registerForm.get('email')?.setValue('valid@test.com');
      expect(component.isValid('email')).toBeFalse();
    });

    it('should return true for isValid on a touched valid field', () => {
      component.registerForm.get('email')?.setValue('valid@test.com');
      component.registerForm.get('email')?.markAsTouched();
      expect(component.isValid('email')).toBeTrue();
    });
  });

  describe('getFieldError', () => {
    it('should return required error with a display-friendly label', () => {
      component.registerForm.get('fullName')?.markAsTouched();
      expect(component.getFieldError('fullName')).toBe('Full name is required');
    });

    it('should return required message for confirmPassword field', () => {
      component.registerForm.get('confirmPassword')?.markAsTouched();
      expect(component.getFieldError('confirmPassword')).toBe('Confirm password is required');
    });

    it('should return email validation message for an invalid email', () => {
      component.registerForm.get('email')?.setValue('not-an-email');
      expect(component.getFieldError('email')).toBe('Please enter a valid email address');
    });

    it('should return minlength message with the required length', () => {
      component.registerForm.get('password')?.setValue('ab');
      expect(component.getFieldError('password')).toBe('Must be at least 6 characters');
    });

    it('should return maxlength message with the required length', () => {
      component.registerForm.get('fullName')?.setValue('a'.repeat(101));
      expect(component.getFieldError('fullName')).toBe('Cannot exceed 100 characters');
    });

    it('should return empty string when there are no errors', () => {
      component.registerForm.get('fullName')?.setValue('Jane Doe');
      expect(component.getFieldError('fullName')).toBe('');
    });
  });

  describe('onSubmit', () => {
    it('should mark all fields as touched and not call the service when form is invalid', () => {
      component.onSubmit();
      expect(mockAuthService.register).not.toHaveBeenCalled();
      Object.values(component.registerForm.controls).forEach(ctrl => {
        expect(ctrl.touched).toBeTrue();
      });
    });

    describe('with a valid form', () => {
      beforeEach(() => {
        component.registerForm.setValue({
          fullName: 'Jane Doe',
          email: 'jane@test.com',
          password: 'Password1!',
          confirmPassword: 'Password1!',
        });
      });

      it('should call authService.register with the correct DTO', () => {
        mockAuthService.register.and.returnValue(of(mockAuthResponse));
        spyOn(router, 'navigate');
        component.onSubmit();
        expect(mockAuthService.register).toHaveBeenCalledWith({
          fullName: 'Jane Doe',
          email: 'jane@test.com',
          password: 'Password1!',
        });
      });

      it('should navigate to /rooms on successful registration', () => {
        mockAuthService.register.and.returnValue(of(mockAuthResponse));
        const navSpy = spyOn(router, 'navigate');
        component.onSubmit();
        expect(navSpy).toHaveBeenCalledWith(['/rooms']);
      });

      it('should clear the loading flag after successful registration', () => {
        mockAuthService.register.and.returnValue(of(mockAuthResponse));
        spyOn(router, 'navigate');
        component.onSubmit();
        expect(component.loading).toBeFalse();
      });

      it('should set apiError from the server message on failure', () => {
        mockAuthService.register.and.returnValue(
          throwError(() => ({ error: { message: 'Email already in use' } }))
        );
        component.onSubmit();
        expect(component.apiError).toBe('Email already in use');
        expect(component.loading).toBeFalse();
      });

      it('should fall back to a generic error message when the server provides none', () => {
        mockAuthService.register.and.returnValue(throwError(() => ({})));
        component.onSubmit();
        expect(component.apiError).toBe('Registration failed. Please try again.');
      });
    });
  });
});
