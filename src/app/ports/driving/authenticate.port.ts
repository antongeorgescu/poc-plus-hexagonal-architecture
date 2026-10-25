/**
 * PORTS · DRIVING (inbound / primary) — AuthenticatePort.
 * PURE TypeScript, ZERO @angular. This is the boundary the core EXPOSES.
 *
 * Primary adapters (the Angular UI, the CLL, a test harness, a future agent
 * console) depend on THIS interface — never on the concrete application service
 * that implements it. This is the only way in for authentication.
 */
import { User } from '../../core/domain/user.entity';

export interface AuthenticatePort {
  /** Exact username + password match, or null (mock authentication). */
  execute(username: string, password: string): Promise<User | null>;
}
