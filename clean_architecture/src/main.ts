/**
 * Bootstraps a standalone Angular app with the infrastructure providers
 * (composition root) and the router. No NgModules.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/ui/app.component';
import { routes } from './app/ui/app.routes';
import { infrastructureProviders } from './app/infrastructure/providers';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    ...infrastructureProviders,
  ],
}).catch((err) => console.error(err));
