import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockAuthService: { isLoggedIn: jasmine.Spy };
  let router: Router;

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

  beforeEach(() => {
    mockAuthService = { isLoggedIn: jasmine.createSpy('isLoggedIn') };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow activation when the user is authenticated', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    expect(runGuard()).toBeTrue();
  });

  it('should deny activation and redirect to /login when not authenticated', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    const navSpy = spyOn(router, 'navigate');

    expect(runGuard()).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should not redirect when the user is authenticated', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    const navSpy = spyOn(router, 'navigate');

    runGuard();

    expect(navSpy).not.toHaveBeenCalled();
  });
});
