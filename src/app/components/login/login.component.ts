import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
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

    this.auth.login(this.username, this.password).subscribe({
      next: (ok) => {
        this.loading.set(false);
        if (ok) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set('Invalid username or password. Please try again.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Unable to reach the account service. Please retry.');
      },
    });
  }
}
