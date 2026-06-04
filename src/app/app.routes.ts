import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'rooms',
    pathMatch: 'full'
  },

  {
    path: 'rooms',
    loadComponent: () =>
      import('./features/rooms/room-list/room-list')
        .then(m => m.RoomList)
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./features/bookings/booking-list/booking-list')
        .then(m => m.BookingList)
  },
  {
    path: 'rooms/:id/bookings',
    loadComponent: () =>
      import('./features/bookings/booking-list/booking-list')
        .then(m => m.BookingList)
  },
  {
    path: 'bookings/new',
    loadComponent: () =>
      import('./features/bookings/booking-form/booking-form')
        .then(m => m.BookingForm)
  },
  // Edit booking
  {
    path: 'bookings/:id/edit',
    loadComponent: () =>
      import('./features/bookings/booking-form/booking-form')
        .then(m => m.BookingForm)
  },
 
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register')
        .then(m => m.Register)
  },
  {
    path: '**',
    redirectTo: 'rooms'
  }
];