import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BookingService } from '../booking.service';
import { environment } from '../../../../environments/environment';
import { Booking, CreateBookingDto, UpdateBookingDto } from '../../models/booking.model';

const BASE_URL = `${environment.apiUrl}/bookings`;

const mockBooking: Booking = {
  id: 1,
  title: 'Team Meeting',
  roomId: 1,
  roomName: 'Board Room',
  startTime: '2026-06-05T09:00:00Z',
  endTime: '2026-06-05T09:30:00Z',
  organizerName: 'John',
  organizerEmail: 'john@test.com',
  status: 'confirmed',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BookingService,
      ],
    });
    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should issue a GET to the base URL and return all bookings', () => {
      service.getAll().subscribe(bookings => {
        expect(bookings).toEqual([mockBooking]);
      });
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush([mockBooking]);
    });

    it('should propagate HTTP errors', () => {
      let errorReceived = false;
      service.getAll().subscribe({ error: () => (errorReceived = true) });
      httpMock.expectOne(BASE_URL).flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      expect(errorReceived).toBeTrue();
    });
  });

  describe('getByRoom', () => {
    it('should issue a GET to the room sub-route and return filtered bookings', () => {
      service.getByRoom(1).subscribe(bookings => {
        expect(bookings).toEqual([mockBooking]);
      });
      const req = httpMock.expectOne(`${BASE_URL}/room/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockBooking]);
    });
  });

  describe('getById', () => {
    it('should issue a GET to the id sub-route and return one booking', () => {
      service.getById(1).subscribe(booking => {
        expect(booking).toEqual(mockBooking);
      });
      const req = httpMock.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBooking);
    });

    it('should propagate 404 when the booking is not found', () => {
      let errorStatus: number | undefined;
      service.getById(999).subscribe({ error: err => (errorStatus = err.status) });
      httpMock.expectOne(`${BASE_URL}/999`).flush('Not Found', { status: 404, statusText: 'Not Found' });
      expect(errorStatus).toBe(404);
    });
  });

  describe('create', () => {
    it('should issue a POST with the DTO body and return the created booking', () => {
      const dto: CreateBookingDto = {
        title: 'Stand Up',
        roomId: 1,
        startTime: '2026-06-05T09:00:00Z',
        endTime: '2026-06-05T09:30:00Z',
        organizerName: 'John',
        organizerEmail: 'john@test.com',
      };
      service.create(dto).subscribe(booking => {
        expect(booking).toEqual(mockBooking);
      });
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockBooking);
    });
  });

  describe('update', () => {
    it('should issue a PUT to the id sub-route with the DTO body and return the updated booking', () => {
      const dto: UpdateBookingDto = {
        title: 'Updated Meeting',
        roomId: 1,
        startTime: '2026-06-05T09:00:00Z',
        endTime: '2026-06-05T10:00:00Z',
        organizerName: 'John',
        organizerEmail: 'john@test.com',
      };
      service.update(1, dto).subscribe(booking => {
        expect(booking).toEqual(mockBooking);
      });
      const req = httpMock.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockBooking);
    });
  });

  describe('cancel', () => {
    it('should issue a DELETE to the id sub-route', () => {
      service.cancel(1).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should propagate errors on cancel failure', () => {
      let errorStatus: number | undefined;
      service.cancel(1).subscribe({ error: err => (errorStatus = err.status) });
      httpMock.expectOne(`${BASE_URL}/1`).flush('Conflict', { status: 409, statusText: 'Conflict' });
      expect(errorStatus).toBe(409);
    });
  });
});
