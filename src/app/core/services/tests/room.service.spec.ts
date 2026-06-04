import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RoomService } from '../room.service';
import { environment } from '../../../../environments/environment';
import { Room } from '../../models/room.model';

const BASE_URL = `${environment.apiUrl}/rooms`;

const mockRooms: Room[] = [
  { id: 1, name: 'Board Room', description: 'Main conference room', capacity: 20 },
  { id: 2, name: 'Huddle', description: 'Small meeting room', capacity: 4 },
];

describe('RoomService', () => {
  let service: RoomService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RoomService,
      ],
    });
    service = TestBed.inject(RoomService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should issue a GET to the base URL and return all rooms', () => {
      service.getAll().subscribe(rooms => {
        expect(rooms).toEqual(mockRooms);
      });
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockRooms);
    });

    it('should propagate HTTP errors', () => {
      let errorReceived = false;
      service.getAll().subscribe({ error: () => (errorReceived = true) });
      httpMock.expectOne(BASE_URL).flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      expect(errorReceived).toBeTrue();
    });
  });

  describe('getById', () => {
    it('should issue a GET to the id sub-route and return one room', () => {
      service.getById(1).subscribe(room => {
        expect(room).toEqual(mockRooms[0]);
      });
      const req = httpMock.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRooms[0]);
    });

    it('should propagate 404 when the room does not exist', () => {
      let errorStatus: number | undefined;
      service.getById(999).subscribe({ error: err => (errorStatus = err.status) });
      httpMock.expectOne(`${BASE_URL}/999`).flush('Not Found', { status: 404, statusText: 'Not Found' });
      expect(errorStatus).toBe(404);
    });
  });
});
