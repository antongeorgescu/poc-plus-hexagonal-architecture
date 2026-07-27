import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AUTHENTICATE } from '../../infrastructure/tokens';
import { SessionStore } from '../../infrastructure/session.store';

/**
 * UI — Login screen. Adapts the form to the Authenticate use case (via token)
 * and stores the authenticated borrower in the SessionStore. It computes nothing.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authenticate = inject(AUTHENTICATE);
  private session = inject(SessionStore);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    if (!this.username || !this.password) {
      this.error.set('Please enter both username and password.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);

    this.authenticate
      .execute(this.username, this.password)
      .then((user) => {
        this.loading.set(false);
        if (user) {
          this.session.setUser(user);
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set('Invalid username or password. Please try again.');
        }
      })
      .catch(() => {
        this.loading.set(false);
        this.error.set('Unable to reach the account service. Please retry.');
      });
  }
}
