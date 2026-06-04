import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BookingForm } from './booking-form';
import { BookingService } from '../../../core/services/booking.service';
import { RoomService } from '../../../core/services/room.service';
import { Booking } from '../../../core/models/booking.model';
import { Room } from '../../../core/models/room.model';

const mockRooms: Room[] = [
  { id: 1, name: 'Board Room', description: 'Main', capacity: 20 },
  { id: 2, name: 'Huddle', description: 'Small', capacity: 4 },
];

const mockBooking: Booking = {
  id: 1,
  title: 'Stand-up',
  roomId: 1,
  roomName: 'Board Room',
  startTime: '2024-01-15T09:00:00Z',
  endTime: '2024-01-15T10:00:00Z',
  organizerName: 'Alice',
  organizerEmail: 'alice@test.com',
  status: 'confirmed',
  createdAt: '2024-01-01T00:00:00Z',
};

function fillValidForm(component: BookingForm): void {
  component.bookingForm.setValue({
    title: 'Team Sync',
    roomId: 1,
    startTime: '2024-01-15T09:00',
    endTime: '2024-01-15T10:00',
    organizerName: 'Alice Smith',
    organizerEmail: 'alice@test.com',
  });
}

describe('BookingForm', () => {
  let mockBookingService: jasmine.SpyObj<BookingService>;
  let mockRoomService: jasmine.SpyObj<RoomService>;

  beforeEach(() => {
    mockBookingService = jasmine.createSpyObj('BookingService', ['getById', 'create', 'update']);
    mockRoomService = jasmine.createSpyObj('RoomService', ['getAll']);
    mockRoomService.getAll.and.returnValue(of(mockRooms));
  });

  describe('create mode', () => {
    let component: BookingForm;
    let fixture: ComponentFixture<BookingForm>;
    let router: Router;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BookingForm],
        providers: [
          provideRouter([]),
          { provide: BookingService, useValue: mockBookingService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}) } },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      fixture = TestBed.createComponent(BookingForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should default to create mode with an empty form', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.bookingId).toBeUndefined();
      expect(component.bookingForm.get('title')?.value).toBe('');
    });

    it('should load available rooms on init', () => {
      expect(mockRoomService.getAll).toHaveBeenCalled();
      expect(component.rooms).toEqual(mockRooms);
    });

    it('should set apiError when room loading fails', () => {
      mockRoomService.getAll.and.returnValue(throwError(() => new Error('Network')));
      component.loadRooms();
      expect(component.apiError).toBe('Failed to load rooms');
    });

    it('should mark all controls as touched and not submit when form is invalid', () => {
      component.onSubmit();
      expect(mockBookingService.create).not.toHaveBeenCalled();
      Object.values(component.bookingForm.controls).forEach(ctrl => {
        expect(ctrl.touched).toBeTrue();
      });
    });

    it('should flag title as invalid when it exceeds 200 characters', () => {
      component.bookingForm.get('title')?.setValue('a'.repeat(201));
      component.bookingForm.get('title')?.markAsTouched();
      expect(component.isInvalid('title')).toBeTrue();
    });

    it('should return endBeforeStart error when end time precedes start time', () => {
      component.bookingForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T09:00',
      });
      expect(component.bookingForm.errors?.['endBeforeStart']).toBeTrue();
    });

    it('should have no time-order error when end time is after start time', () => {
      component.bookingForm.patchValue({
        startTime: '2024-01-15T09:00',
        endTime: '2024-01-15T10:00',
      });
      expect(component.bookingForm.errors?.['endBeforeStart']).toBeFalsy();
    });

    it('should have no time-order error when either time field is empty', () => {
      component.bookingForm.patchValue({ startTime: '', endTime: '' });
      expect(component.bookingForm.errors?.['endBeforeStart']).toBeFalsy();
    });

    it('should submit a create request and show success message', fakeAsync(() => {
      const navSpy = spyOn(router, 'navigate');
      mockBookingService.create.and.returnValue(of(mockBooking));
      fillValidForm(component);
      component.onSubmit();
      expect(component.successMessage).toBe('Booking created successfully!');
      tick(1500);
      expect(navSpy).toHaveBeenCalledWith(['/bookings']);
    }));

    it('should set apiError and clear submitting flag on create failure', () => {
      mockBookingService.create.and.returnValue(
        throwError(() => ({ error: { message: 'Conflict' } }))
      );
      fillValidForm(component);
      component.onSubmit();
      expect(component.apiError).toBe('Conflict');
      expect(component.submitting).toBeFalse();
    });

    it('should fall back to generic error message when server provides none', () => {
      mockBookingService.create.and.returnValue(throwError(() => ({})));
      fillValidForm(component);
      component.onSubmit();
      expect(component.apiError).toBe('Failed to save booking. Please try again.');
    });

    it('should return required error string for an empty required field', () => {
      component.bookingForm.get('title')?.markAsTouched();
      expect(component.getError('title')).toBe('title is required');
    });

    it('should return email error string for an invalid email', () => {
      component.bookingForm.get('organizerEmail')?.setValue('invalid');
      component.bookingForm.get('organizerEmail')?.markAsTouched();
      expect(component.getError('organizerEmail')).toBe('Please enter a valid email');
    });

    it('should return maxlength error string when value is too long', () => {
      component.bookingForm.get('organizerName')?.setValue('a'.repeat(101));
      component.bookingForm.get('organizerName')?.markAsTouched();
      expect(component.getError('organizerName')).toBe('Too long!');
    });

    it('should return empty string from getError when there are no errors', () => {
      component.bookingForm.get('title')?.setValue('Valid Title');
      expect(component.getError('title')).toBe('');
    });

    it('should navigate to /bookings on goBack', () => {
      const navSpy = spyOn(router, 'navigate');
      component.goBack();
      expect(navSpy).toHaveBeenCalledWith(['/bookings']);
    });
  });

  describe('edit mode', () => {
    let component: BookingForm;
    let fixture: ComponentFixture<BookingForm>;
    let router: Router;

    beforeEach(async () => {
      mockBookingService.getById.and.returnValue(of(mockBooking));

      await TestBed.configureTestingModule({
        imports: [BookingForm],
        providers: [
          provideRouter([]),
          { provide: BookingService, useValue: mockBookingService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: ActivatedRoute, useValue: { params: of({ id: '1' }), queryParams: of({}) } },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      fixture = TestBed.createComponent(BookingForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should enter edit mode when an id param is present', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.bookingId).toBe(1);
    });

    it('should populate the form with the existing booking data', () => {
      expect(mockBookingService.getById).toHaveBeenCalledWith(1);
      expect(component.bookingForm.get('title')?.value).toBe('Stand-up');
      expect(component.bookingForm.get('organizerName')?.value).toBe('Alice');
      expect(component.bookingForm.get('organizerEmail')?.value).toBe('alice@test.com');
    });

    it('should submit an update request and show success message', fakeAsync(() => {
      const navSpy = spyOn(router, 'navigate');
      mockBookingService.update.and.returnValue(of(mockBooking));
      fillValidForm(component);
      component.onSubmit();
      expect(component.successMessage).toBe('Booking updated successfully!');
      tick(1500);
      expect(navSpy).toHaveBeenCalledWith(['/bookings']);
    }));

    it('should set apiError and clear submitting flag when the update fails', () => {
      mockBookingService.update.and.returnValue(throwError(() => ({})));
      fillValidForm(component);
      component.onSubmit();
      expect(component.apiError).toBe('Failed to save booking. Please try again.');
      expect(component.submitting).toBeFalse();
    });

    it('should set apiError and clear loadingBooking when fetching the booking fails', () => {
      mockBookingService.getById.and.returnValue(throwError(() => new Error('Not found')));
      component.loadBookingForEdit(99);
      expect(component.apiError).toBe('Failed to load booking');
      expect(component.loadingBooking).toBeFalse();
    });
  });

  describe('with roomId query param', () => {
    let component: BookingForm;
    let fixture: ComponentFixture<BookingForm>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BookingForm],
        providers: [
          provideRouter([]),
          { provide: BookingService, useValue: mockBookingService },
          { provide: RoomService, useValue: mockRoomService },
          {
            provide: ActivatedRoute,
            useValue: { params: of({}), queryParams: of({ roomId: '2' }) },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BookingForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should pre-select the room from the query param', () => {
      expect(component.bookingForm.get('roomId')?.value).toBe(2);
    });
  });
});
