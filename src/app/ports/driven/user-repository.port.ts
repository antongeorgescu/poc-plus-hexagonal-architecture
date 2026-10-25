/**
 * PORTS · DRIVEN (outbound / secondary) — UserRepositoryPort.
 * PURE TypeScript, ZERO @angular. This is an interface the core REQUIRES and
 * OWNS; a secondary adapter implements it. The core drives it — it never names
 * the database, an HTTP endpoint or any concrete data source, only this port.
 */
import { User } from '../../core/domain/user.entity';

export interface UserRepositoryPort {
  /**
   * Exact username + password match, or null (mock authentication). The password
   * is checked by the system of record and never travels back in the `User`.
   */
  findByCredentials(username: string, password: string): Promise<User | null>;
}
