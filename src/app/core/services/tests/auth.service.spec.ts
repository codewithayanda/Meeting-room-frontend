import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { environment } from '../../../../environments/environment';
import { AuthResponse, LoginDto, RegisterDto } from '../../models/auth.model';

const BASE_URL = `${environment.apiUrl}/auth`;

const mockAuthResponse: AuthResponse = {
  token: 'mock-jwt-token',
  fullName: 'Jane Doe',
  email: 'jane@test.com',
  role: 'user',
  expiresAt: '2099-01-01T00:00:00Z',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial signal state', () => {
    it('should have isLoggedIn as false when localStorage is empty', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should have currentUser as null when localStorage is empty', () => {
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('login', () => {
    it('should POST to the login endpoint with the provided credentials', () => {
      const dto: LoginDto = { email: 'jane@test.com', password: 'secret' };
      service.login(dto).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockAuthResponse);
    });

    it('should store token and user in localStorage on success', () => {
      service.login({ email: 'jane@test.com', password: 'secret' }).subscribe();
      httpMock.expectOne(`${BASE_URL}/login`).flush(mockAuthResponse);
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockAuthResponse);
    });

    it('should update isLoggedIn and currentUser signals on success', () => {
      service.login({ email: 'jane@test.com', password: 'secret' }).subscribe();
      httpMock.expectOne(`${BASE_URL}/login`).flush(mockAuthResponse);
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.currentUser()).toEqual(mockAuthResponse);
    });

    it('should propagate HTTP errors without modifying localStorage', () => {
      let errorReceived = false;
      service.login({ email: 'bad@test.com', password: 'wrong' }).subscribe({
        error: () => (errorReceived = true),
      });
      httpMock.expectOne(`${BASE_URL}/login`).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      expect(errorReceived).toBeTrue();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('register', () => {
    it('should POST to the register endpoint with the provided data', () => {
      const dto: RegisterDto = { fullName: 'Jane Doe', email: 'jane@test.com', password: 'secret' };
      service.register(dto).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockAuthResponse);
    });

    it('should store token and update signals on success', () => {
      service.register({ fullName: 'Jane Doe', email: 'jane@test.com', password: 'secret' }).subscribe();
      httpMock.expectOne(`${BASE_URL}/register`).flush(mockAuthResponse);
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.currentUser()).toEqual(mockAuthResponse);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockAuthResponse));
      service.isLoggedIn.set(true);
      service.currentUser.set(mockAuthResponse);
    });

    it('should remove token and user from localStorage', () => {
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should reset isLoggedIn signal to false', () => {
      service.logout();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should reset currentUser signal to null', () => {
      service.logout();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return the stored token string', () => {
      localStorage.setItem('token', 'stored-token');
      expect(service.getToken()).toBe('stored-token');
    });
  });
});
