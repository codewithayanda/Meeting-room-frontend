import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an invalid form', () => {
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should not call auth service and should mark all fields touched on invalid submit', () => {
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(component.loginForm.get('email')?.touched).toBeTrue();
    expect(component.loginForm.get('password')?.touched).toBeTrue();
  });

  it('should flag email as invalid for a bad format when touched', () => {
    component.loginForm.get('email')?.setValue('not-an-email');
    component.loginForm.get('email')?.markAsTouched();
    expect(component.isInvalid('email')).toBeTrue();
  });

  it('should flag password as invalid when blank and touched', () => {
    component.loginForm.get('password')?.markAsTouched();
    expect(component.isInvalid('password')).toBeTrue();
  });

  it('should not flag a field as invalid when untouched', () => {
    expect(component.isInvalid('email')).toBeFalse();
  });

  it('should return true for isValid on a touched valid field', () => {
    component.loginForm.get('email')?.setValue('valid@test.com');
    component.loginForm.get('email')?.markAsTouched();
    expect(component.isValid('email')).toBeTrue();
  });

  it('should return false for isValid on an untouched field', () => {
    component.loginForm.get('email')?.setValue('valid@test.com');
    expect(component.isValid('email')).toBeFalse();
  });

  describe('onSubmit with valid credentials', () => {
    const authResponse: AuthResponse = {
      token: 'tok',
      fullName: 'Test User',
      email: 'user@test.com',
      role: 'user',
      expiresAt: '2099-01-01',
    };

    beforeEach(() => {
      component.loginForm.setValue({ email: 'user@test.com', password: 'secret' });
    });

    it('should call auth service with the form values', () => {
      mockAuthService.login.and.returnValue(of(authResponse));
      spyOn(router, 'navigate');
      component.onSubmit();
      expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'user@test.com', password: 'secret' });
    });

    it('should navigate to /rooms on success', () => {
      mockAuthService.login.and.returnValue(of(authResponse));
      const navSpy = spyOn(router, 'navigate');
      component.onSubmit();
      expect(navSpy).toHaveBeenCalledWith(['/rooms']);
    });

    it('should clear loading state after successful login', () => {
      mockAuthService.login.and.returnValue(of(authResponse));
      spyOn(router, 'navigate');
      component.onSubmit();
      expect(component.loading).toBeFalse();
    });

    it('should display server error message on login failure', () => {
      mockAuthService.login.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid credentials' } }))
      );
      component.onSubmit();
      expect(component.error).toBe('Invalid credentials');
      expect(component.loading).toBeFalse();
    });

    it('should fall back to default error message when server provides none', () => {
      mockAuthService.login.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      expect(component.error).toBe('Invalid email or password');
    });
  });
});
