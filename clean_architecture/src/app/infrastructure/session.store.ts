/**
 * INFRASTRUCTURE — Session state (a framework concern). Angular signal service
 * holding the authenticated borrower. The core has no notion of "sessions".
 */
import { Injectable, computed, signal } from '@angular/core';
import { User } from '../domain/user.entity';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  setUser(user: User): void {
    this._currentUser.set(user);
  }

  clear(): void {
    this._currentUser.set(null);
  }
}
