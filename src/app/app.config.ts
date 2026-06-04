import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Why withComponentInputBinding:
    // Allows route params to bind directly to components!
    provideRouter(routes, withComponentInputBinding()),

    // Why withInterceptors:
    // Registers our auth interceptor — adds token to all requests!
    provideHttpClient(withInterceptors([authInterceptor])),

    // Why: Enables Angular animations for smooth UI!
  ]
};
