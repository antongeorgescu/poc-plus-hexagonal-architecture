/**
 * ADAPTERS — Persistence gateway. Implements the UserRepositoryPort defined in
 * the application ring (dependency points inward). Loads assets/users.csv via
 * fetch() and parses it. The system of record is a plain CSV file.
 */
import { UserRepositoryPort } from '../../application/ports/user-repository.port';
import { User, UserType } from '../../domain/user.entity';

export class CsvUserRepository implements UserRepositoryPort {
  private cache: Promise<User[]> | null = null;

  getUsers(): Promise<User[]> {
    // Loaded once, then replayed to all callers.
    if (!this.cache) {
      this.cache = fetch('assets/users.csv')
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load users.csv (${res.status})`);
          return res.text();
        })
        .then((csv) => this.parseCsv(csv));
    }
    return this.cache;
  }

  async findByCredentials(username: string, password: string): Promise<User | null> {
    const u = username.trim().toLowerCase();
    const users = await this.getUsers();
    return (
      users.find(
        (row) => row.username.toLowerCase() === u && row.password === password
      ) ?? null
    );
  }

  /**
   * Minimal CSV parser. The data set intentionally avoids embedded commas and
   * quotes so a straightforward split is sufficient for this POC.
   */
  private parseCsv(csv: string): User[] {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

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
