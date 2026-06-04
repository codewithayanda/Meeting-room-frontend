import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BookingList } from './booking-list';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';

const mockBookings: Booking[] = [
  {
    id: 1,
    title: 'Stand-up',
    roomId: 1,
    roomName: 'Board Room',
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T09:30:00Z',
    organizerName: 'Alice',
    organizerEmail: 'alice@test.com',
    status: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Planning',
    roomId: 2,
    roomName: 'Huddle',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T11:00:00Z',
    organizerName: 'Bob',
    organizerEmail: 'bob@test.com',
    status: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

describe('BookingList', () => {
  let mockBookingService: jasmine.SpyObj<BookingService>;

  beforeEach(() => {
    mockBookingService = jasmine.createSpyObj('BookingService', ['getAll', 'getByRoom', 'cancel']);
  });

  describe('when loading all bookings', () => {
    let component: BookingList;
    let fixture: ComponentFixture<BookingList>;
    let router: Router;

    beforeEach(async () => {
      mockBookingService.getAll.and.returnValue(of(mockBookings));

      await TestBed.configureTestingModule({
        imports: [BookingList],
        providers: [
          provideRouter([]),
          { provide: BookingService, useValue: mockBookingService },
          { provide: ActivatedRoute, useValue: { params: of({}) } },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      fixture = TestBed.createComponent(BookingList);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load all bookings on init and clear the loading flag', () => {
      expect(mockBookingService.getAll).toHaveBeenCalled();
      expect(component.bookings).toEqual(mockBookings);
      expect(component.loading).toBeFalse();
    });

    it('should set error and clear loading flag on fetch failure', () => {
      mockBookingService.getAll.and.returnValue(throwError(() => new Error('Network')));
      component.loadBookings();
      expect(component.error).toBe('Failed to load bookings');
      expect(component.loading).toBeFalse();
    });

    it('should navigate to new booking without a room context', () => {
      const spy = spyOn(router, 'navigate');
      component.createBooking();
      expect(spy).toHaveBeenCalledWith(['/bookings/new'], { queryParams: {} });
    });

    it('should navigate to the edit route for a given booking', () => {
      const spy = spyOn(router, 'navigate');
      component.editBooking(1);
      expect(spy).toHaveBeenCalledWith(['/bookings', 1, 'edit']);
    });

    it('should set selectedBooking and show confirm dialog when cancel is initiated', () => {
      component.cancelBooking(mockBookings[0]);
      expect(component.selectedBooking).toBe(mockBookings[0]);
      expect(component.showConfirmDialog).toBeTrue();
    });

    it('should not call the cancel API when no booking is selected', () => {
      component.selectedBooking = null;
      component.confirmCancel();
      expect(mockBookingService.cancel).not.toHaveBeenCalled();
    });

    it('should cancel, reload, and clear success message after timeout', fakeAsync(() => {
      mockBookingService.cancel.and.returnValue(of(undefined));
      component.selectedBooking = mockBookings[0];
      component.confirmCancel();
      expect(component.showConfirmDialog).toBeFalse();
      expect(component.successMessage).toBe('Booking cancelled successfully!');
      tick(3000);
      expect(component.successMessage).toBe('');
    }));

    it('should set the server error message on cancel failure', () => {
      mockBookingService.cancel.and.returnValue(
        throwError(() => ({ error: { message: 'Already cancelled' } }))
      );
      component.selectedBooking = mockBookings[0];
      component.confirmCancel();
      expect(component.error).toBe('Already cancelled');
      expect(component.showConfirmDialog).toBeFalse();
    });

    it('should fall back to generic cancel error message when server provides none', () => {
      mockBookingService.cancel.and.returnValue(throwError(() => ({})));
      component.selectedBooking = mockBookings[0];
      component.confirmCancel();
      expect(component.error).toBe('Failed to cancel booking');
    });
  });

  describe('when filtering by room', () => {
    let component: BookingList;
    let fixture: ComponentFixture<BookingList>;
    let router: Router;

    beforeEach(async () => {
      mockBookingService.getByRoom.and.returnValue(of([mockBookings[0]]));

      await TestBed.configureTestingModule({
        imports: [BookingList],
        providers: [
          provideRouter([]),
          { provide: BookingService, useValue: mockBookingService },
          { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      fixture = TestBed.createComponent(BookingList);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should extract roomId from route params and load room-specific bookings', () => {
      expect(component.roomId).toBe(1);
      expect(mockBookingService.getByRoom).toHaveBeenCalledWith(1);
      expect(component.bookings).toEqual([mockBookings[0]]);
    });

    it('should include roomId in the new booking navigation query params', () => {
      const spy = spyOn(router, 'navigate');
      component.createBooking();
      expect(spy).toHaveBeenCalledWith(['/bookings/new'], { queryParams: { roomId: 1 } });
    });
  });
});
