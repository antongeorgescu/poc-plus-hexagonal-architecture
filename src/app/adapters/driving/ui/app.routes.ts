import { Routes } from '@angular/router';
import { authGuard } from '../../../configuration/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    // Read-only view of a business setting. Deliberately NOT behind authGuard:
    // it is linked from the sign-in page and shows no borrower data.
    path: 'configuration',
    loadComponent: () =>
      import('./policy/determinism-policy.component').then(
        (m) => m.DeterminismPolicyComponent
      ),
  },
  { path: '**', redirectTo: 'login' },
];
