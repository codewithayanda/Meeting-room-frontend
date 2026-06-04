import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';
import { Booking, CreateBookingDto, UpdateBookingDto } from '../../../core/models/booking.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, combineLatest, EMPTY } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.html',
  styleUrls: ['./booking-form.scss'],
})
export class BookingForm implements OnInit {
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private roomService = inject(RoomService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  bookingForm!: FormGroup;
  rooms: Room[] = [];
  isEditMode = false;
  bookingId?: number;
  loading = false;
  loadingBooking = false;
  submitting = false;
  apiError = '';
  successMessage = '';

  ngOnInit(): void {
    this.initForm();
    this.loadRooms();

    this.route.params
    .pipe(
      switchMap( params => {
        if (params['id']) {
          this.isEditMode = true;
          this.bookingId = +params['id'];
          return this.bookingService.getById(this.bookingId);
        }
        return EMPTY;
      }),
    takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (booking) => {
        this.bookingForm.patchValue({
          title: booking.title,
          roomId: booking.roomId,
          startTime: this.formatDateTimeLocal( booking.startTime),
          endTime: this.formatDateTimeLocal( booking.endTime),
          organizerName: booking.organizerName,
          organizerEmail: booking.organizerEmail
        });
        this.loadingBooking = false;
      },
      error: (err: HttpErrorResponse) => {
        this.apiError = err.error?.message || 'Failed to load booking';
        this.loadingBooking = false;
      }
    });

    this.route.queryParams
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(params => {
      if (params['roomId']) {
        this.bookingForm.patchValue({
          roomId: +params['roomId']
        });
      }
    });
  }

  initForm(): void {
    this.bookingForm = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.maxLength(200)
      ]],
      roomId: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      organizerName: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
      organizerEmail: ['', [
        Validators.required,
        Validators.email
      ]]
    },
    { validators: this.endAfterStartValidator });
  }

  endAfterStartValidator(form: FormGroup) {
    const start = form.get('startTime')?.value;
    const end = form.get('endTime')?.value;

    if (start && end && new Date(end) <= new Date(start)) {
      return { endBeforeStart: true };
    }
    return null;
  }

  loadRooms(): void {
    this.roomService.getAll()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: rooms => this.rooms = rooms,
      error: (err: HttpErrorResponse) => this.apiError = err.error?.message || 'Failed to load rooms'
    });
  }

  loadBookingForEdit(id: number): void {
    this.loadingBooking = true;
    this.bookingService.getById(id)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (booking: Booking) => {
        this.bookingForm.patchValue({
          title: booking.title,
          roomId: booking.roomId,
          startTime: this.formatDateTimeLocal(booking.startTime),
          endTime: this.formatDateTimeLocal(booking.endTime),
          organizerName: booking.organizerName,
          organizerEmail: booking.organizerEmail
        });
        this.loadingBooking = false;
      },
      error: (err: HttpErrorResponse) => {
        this.apiError = err.error?.message || 'Failed to load booking';
        this.loadingBooking = false;
      }
    });
  }

  formatDateTimeLocal(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.apiError = '';

    const formValue = this.bookingForm.value;
    const dto = {
      title: formValue.title,
      roomId: +formValue.roomId,
      startTime: new Date(formValue.startTime).toISOString(),
      endTime: new Date(formValue.endTime).toISOString(),
      organizerName: formValue.organizerName,
      organizerEmail: formValue.organizerEmail
    };

    const request$ = this.isEditMode && this.bookingId
      ? this.bookingService.update(this.bookingId, dto)
      : this.bookingService.create(dto);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = this.isEditMode ? 'Booking updated successfully!' : 'Booking created successfully!';

        setTimeout(() => {
          this.router.navigate(['/bookings']);
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.apiError = err.error?.message || 'Failed to save booking. Please try again.';
      }
    });
  }

  isInvalid(fieldName: string): boolean {
    const field = this.bookingForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getError(fieldName: string): string {
    const field = this.bookingForm.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['email']) return 'Please enter a valid email';
    if (field.errors['maxlength']) return `Too long!`;
    return 'Invalid value';
  }

  goBack(): void {
    this.router.navigate(['/bookings']);
  }
}