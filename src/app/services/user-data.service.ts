import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { User, UserType } from '../models/user.model';

/**
 * Loads and parses the single source of truth: assets/users.csv.
 * Each user occupies exactly one row.
 */
@Injectable({ providedIn: 'root' })
export class UserDataService {
  private http = inject(HttpClient);

  /** Cached parse of the CSV — loaded once, replayed to all subscribers. */
  private users$: Observable<User[]> = this.http
    .get('assets/users.csv', { responseType: 'text' })
    .pipe(
      map((csv) => this.parseCsv(csv)),
      shareReplay(1)
    );

  getUsers(): Observable<User[]> {
    return this.users$;
  }

  /** Finds a user by exact username + password (mock authentication). */
  findByCredentials(username: string, password: string): Observable<User | undefined> {
    const u = username.trim().toLowerCase();
    return this.users$.pipe(
      map((users) =>
        users.find(
          (row) => row.username.toLowerCase() === u && row.password === password
        )
      )
    );
  }

  /**
   * Minimal CSV parser. The data set intentionally avoids embedded commas
   * and quotes so a straightforward split is sufficient for this POC.
   */
  private parseCsv(csv: string): User[] {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',').map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.trim());
      const record: Record<string, string> = {};
      headers.forEach((h, i) => (record[h] = cells[i] ?? ''));

      return {
        username: record['username'],
        password: record['password'],
        firstName: record['firstName'],
        lastName: record['lastName'],
        userType: Number(record['userType']) as UserType,
        programOfStudy: record['programOfStudy'],
        city: record['city'],
        state: record['state'],
        originalAmount: Number(record['originalAmount']),
        currentBalance: Number(record['currentBalance']),
        interestRate: Number(record['interestRate']),
        monthlyPayment: Number(record['monthlyPayment']),
        nextPaymentDate: record['nextPaymentDate'],
        nextPaymentAmount: Number(record['nextPaymentAmount']),
        maturityDate: record['maturityDate'],
        paymentsMade: Number(record['paymentsMade']),
        paymentsMissed: Number(record['paymentsMissed']),
        onTimeStreak: Number(record['onTimeStreak']),
        creditScore: Number(record['creditScore']),
      } satisfies User;
    });
  }
}
