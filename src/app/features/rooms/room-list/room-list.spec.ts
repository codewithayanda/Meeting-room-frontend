import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RoomList } from './room-list';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';

const mockRooms: Room[] = [
  { id: 1, name: 'Board Room', description: 'Main conference room', capacity: 20 },
  { id: 2, name: 'Huddle', description: 'Small meeting room', capacity: 4 },
];

describe('RoomList', () => {
  let component: RoomList;
  let fixture: ComponentFixture<RoomList>;
  let mockRoomService: jasmine.SpyObj<RoomService>;
  let router: Router;

  beforeEach(async () => {
    mockRoomService = jasmine.createSpyObj('RoomService', ['getAll']);

    await TestBed.configureTestingModule({
      imports: [RoomList],
      providers: [
        provideRouter([]),
        { provide: RoomService, useValue: mockRoomService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RoomList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockRoomService.getAll.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load and store rooms on init', () => {
    mockRoomService.getAll.and.returnValue(of(mockRooms));
    fixture.detectChanges();
    expect(component.rooms).toEqual(mockRooms);
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
  });

  it('should set error message and clear loading flag on fetch failure', () => {
    mockRoomService.getAll.and.returnValue(throwError(() => new Error('Server error')));
    fixture.detectChanges();
    expect(component.error).toBe('Failed to load rooms. Please try again.');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to room bookings on viewBookings', () => {
    mockRoomService.getAll.and.returnValue(of([]));
    fixture.detectChanges();
    const spy = spyOn(router, 'navigate');
    component.viewBookings(1);
    expect(spy).toHaveBeenCalledWith(['/rooms', 1, 'bookings']);
  });

  it('should navigate to new booking with roomId query param on bookRoom', () => {
    mockRoomService.getAll.and.returnValue(of([]));
    fixture.detectChanges();
    const spy = spyOn(router, 'navigate');
    component.bookRoom(2);
    expect(spy).toHaveBeenCalledWith(['/bookings/new'], { queryParams: { roomId: 2 } });
  });
});
