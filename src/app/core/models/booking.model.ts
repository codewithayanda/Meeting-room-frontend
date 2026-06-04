export interface Booking {
  id: number;
  title: string;
  organizerName: string;
  organizerEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  roomId: number;
  roomName: string;
}

export interface CreateBookingDto {
  title: string;
  organizerName: string;
  organizerEmail: string;
  startTime: string;
  endTime: string;
  roomId: number;
}

export interface UpdateBookingDto {
  title: string;
  organizerName: string;
  organizerEmail: string;
  startTime: string;
  endTime: string;
  roomId: number;
}