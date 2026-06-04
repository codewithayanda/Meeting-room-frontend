import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let router: Router;
  let mockAuthService: { getToken: jasmine.Spy; logout: jasmine.Spy };

  beforeEach(() => {
    mockAuthService = {
      getToken: jasmine.createSpy('getToken').and.returnValue(null),
      logout: jasmine.createSpy('logout'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach a Bearer Authorization header when a token exists', () => {
    mockAuthService.getToken.and.returnValue('valid-token');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush({});
  });

  it('should not attach an Authorization header when no token exists', () => {
    mockAuthService.getToken.and.returnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should call logout and navigate to /login on a 401 response', () => {
    mockAuthService.getToken.and.returnValue('expired-token');
    const navSpy = spyOn(router, 'navigate');

    httpClient.get('/api/test').subscribe({ error: () => {} });

    httpMock.expectOne('/api/test').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should propagate non-401 errors without calling logout', () => {
    mockAuthService.getToken.and.returnValue('valid-token');
    let receivedStatus: number | undefined;

    httpClient.get('/api/test').subscribe({ error: err => (receivedStatus = err.status) });

    httpMock.expectOne('/api/test').flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(mockAuthService.logout).not.toHaveBeenCalled();
    expect(receivedStatus).toBe(500);
  });

  it('should pass the original request unmodified on non-401 errors', () => {
    mockAuthService.getToken.and.returnValue('valid-token');

    httpClient.post('/api/bookings', { title: 'Meeting' }).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/bookings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Meeting' });
    req.flush({});
  });
});
