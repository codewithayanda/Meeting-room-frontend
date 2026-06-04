import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NavbarComponent } from './navbar';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let router: Router;
  let mockAuthService: {
    isLoggedIn: jasmine.Spy;
    currentUser: jasmine.Spy;
    logout: jasmine.Spy;
  };

  beforeEach(async () => {
    mockAuthService = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
      currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
      logout: jasmine.createSpy('logout'),
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the brand name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.navbar-brand a')?.textContent).toContain('Meeting Room Booking');
  });

  it('should show the login link when not authenticated', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const loginLink = Array.from(compiled.querySelectorAll('a')).find(
      a => a.textContent?.trim() === 'Login'
    );
    expect(loginLink).toBeDefined();
    expect(compiled.querySelector('button')).toBeNull();
  });

  it('should show the username and logout button when authenticated', () => {
    const user: AuthResponse = {
      token: 'tok',
      fullName: 'Alice Smith',
      email: 'alice@test.com',
      role: 'user',
      expiresAt: '2099-01-01',
    };
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.currentUser.and.returnValue(user);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('button')?.textContent?.trim()).toBe('Logout');
    expect(compiled.querySelector('span')?.textContent).toContain('Alice Smith');

    const loginLink = Array.from(compiled.querySelectorAll('a')).find(
      a => a.textContent?.trim() === 'Login'
    );
    expect(loginLink).toBeUndefined();
  });

  it('should call authService.logout and navigate to /login on logout()', () => {
    const navSpy = spyOn(router, 'navigate');
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });
});
