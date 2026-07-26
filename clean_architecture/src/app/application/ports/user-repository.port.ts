/**
 * APPLICATION — Outbound port. PURE TypeScript, ZERO @angular.
 * The use cases depend on this interface; the persistence adapter implements it.
 * Dependency Rule: the adapter points inward at this port, never the reverse.
 */
import { User } from '../../domain/user.entity';

export interface UserRepositoryPort {
  /** All borrower records from the system of record. */
  getUsers(): Promise<User[]>;
  /** Exact username + password match, or null (mock authentication). */
  findByCredentials(username: string, password: string): Promise<User | null>;
}
