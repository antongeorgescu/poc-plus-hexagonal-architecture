import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
import { UserDataService } from './user-data.service';

/**
 * Mock authentication. Credentials are validated against the CSV rows.
 * The authenticated user is exposed as a signal so components can react.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private userData = inject(UserDataService);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  login(username: string, password: string): Observable<boolean> {
    return this.userData.findByCredentials(username, password).pipe(
      map((user) => {
        if (user) {
          this._currentUser.set(user);
          return true;
        }
        return false;
      })
    );
  }

  logout(): void {
    this._currentUser.set(null);
  }
}
