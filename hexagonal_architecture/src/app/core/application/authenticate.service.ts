/**
 * CORE · APPLICATION — Authenticate use case.
 * PURE TypeScript, ZERO @angular. Plain class.
 *
 * SEAM: it IMPLEMENTS the driving port (AuthenticatePort) and depends ONLY on a
 * driven port interface (UserRepositoryPort), supplied via the constructor by
 * the composition root. The core depends on driven ports; it never names an
 * adapter or a data source.
 */
import { AuthenticatePort } from '../../ports/driving/authenticate.port';
import { UserRepositoryPort } from '../../ports/driven/user-repository.port';
import { User } from '../domain/user.entity';

export class AuthenticateService implements AuthenticatePort {
  constructor(private readonly users: UserRepositoryPort) {}

  execute(username: string, password: string): Promise<User | null> {
    return this.users.findByCredentials(username, password);
  }
}
