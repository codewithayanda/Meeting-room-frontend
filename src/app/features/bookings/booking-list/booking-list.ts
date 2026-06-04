import { Component, OnInit, inject, Input, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Booking } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { pipe } from 'rxjs/internal/util/pipe';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-list.html',
  styleUrls: ['./booking-list.scss'],
})
export class BookingList implements OnInit {
  private bookingService = inject(BookingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // Input from route params
  @Input() id?: string; // room id from URL

  bookings: Booking[] = [];
  loading = false;
  error = '';
  successMessage = '';
  showConfirmDialog = false;
  selectedBooking: Booking | null = null;
  roomId?: number;

  ngOnInit(): void {
    this.route.params
    .pipe(
      switchMap(params => {
        this.roomId = params['id'] ? +params['id'] : undefined;

        return this.roomId ? this.bookingService.getByRoom(this.roomId) : this.bookingService.getAll();
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load bookings';
        this.loading = false;
      }
    });
  }

  loadBookings(): void {
    this.loading = true;
    this.error = '';

    const request$ = this.roomId ? this.bookingService.getByRoom(this.roomId) : this.bookingService.getAll();

    request$.subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'Failed to load bookings';
        this.loading = false;
      }
    });
  }

  createBooking(): void {
    const queryParams = this.roomId
      ? { roomId: this.roomId }
      : {};
    this.router.navigate(['/bookings/new'], { queryParams });
  }

  editBooking(id: number): void {
    this.router.navigate(['/bookings', id, 'edit']);
  }

  cancelBooking(booking: Booking): void {
    this.selectedBooking = booking;
    this.showConfirmDialog = true;
  }

  confirmCancel(): void {
    if (!this.selectedBooking) return;

    this.bookingService.cancel(this.selectedBooking.id)
      .subscribe({
        next: () => {
          this.showConfirmDialog = false;
          this.successMessage = 'Booking cancelled successfully!';
          this.loadBookings();

          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.showConfirmDialog = false;
          this.error = err.error?.message
            || 'Failed to cancel booking';
        }
      });
  }
}
