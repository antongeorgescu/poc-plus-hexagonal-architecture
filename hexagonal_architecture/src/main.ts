/**
 * Bootstraps a standalone Angular app with the hexagonal composition root
 * (ports-and-adapters wiring) and the router. No NgModules.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/adapters/driving/ui/app.component';
import { routes } from './app/adapters/driving/ui/app.routes';
import { hexagonalProviders } from './app/configuration/providers';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    ...hexagonalProviders,
  ],
}).catch((err) => console.error(err));
