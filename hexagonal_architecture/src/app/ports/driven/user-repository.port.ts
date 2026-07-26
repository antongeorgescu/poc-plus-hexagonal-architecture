/**
 * PORTS · DRIVEN (outbound / secondary) — UserRepositoryPort.
 * PURE TypeScript, ZERO @angular. This is an interface the core REQUIRES and
 * OWNS; a secondary adapter implements it. The core drives it — it never names
 * users.csv or any concrete data source, only this port.
 */
import { User } from '../../core/domain/user.entity';

export interface UserRepositoryPort {
  /** All borrower records from the system of record. */
  getUsers(): Promise<User[]>;
  /** Exact username + password match, or null (mock authentication). */
  findByCredentials(username: string, password: string): Promise<User | null>;
}
