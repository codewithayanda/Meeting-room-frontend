import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Room } from "../../../core/models/room.model";
import { RoomService } from '../../../core/services/room.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-list.html',
  styleUrls: ['./room-list.scss'],
})
export class RoomList implements OnInit {
  private roomService = inject(RoomService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  rooms: Room[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;
    this.error = '';

    this.roomService.getAll()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'Failed to load rooms. Please try again.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  viewBookings(roomId: number): void {
    this.router.navigate(['/rooms', roomId, 'bookings']);
  }

  bookRoom(roomId: number): void {
    this.router.navigate(['/bookings/new'],
      { queryParams: { roomId } });
  }
}
