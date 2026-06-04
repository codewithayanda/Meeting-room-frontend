import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Room } from '../models/room.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = `${environment.apiUrl}/rooms`;

  // built-in HTTP service
  constructor(private http: HttpClient) {}

  // Get all rooms
  getAll(): Observable<Room[]> {
    return this.http.get<Room[]>(this.apiUrl);
  }

  // Get room by ID
  getById(id: number): Observable<Room> {
    return this.http.get<Room>(`${this.apiUrl}/${id}`);
  }

  //Components will subscribe to these Observables to get data when it's ready
}