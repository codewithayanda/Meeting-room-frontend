import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Booking, CreateBookingDto, UpdateBookingDto } from '../models/booking.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  // Get all bookings
  getAll(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.apiUrl);
  }

  // Get bookings by room
  getByRoom(roomId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/room/${roomId}`);
  }

  // Get single booking
  getById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  // Create booking — POST with body
  create(dto: CreateBookingDto): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, dto);
  }

  // Update booking — PUT with body
  update(id: number, dto: UpdateBookingDto): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}`, dto);
  }

  // Cancel booking — DELETE
  cancel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}