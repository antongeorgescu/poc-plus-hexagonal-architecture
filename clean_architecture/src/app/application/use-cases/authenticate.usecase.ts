/**
 * APPLICATION — Use case / interactor. PURE TypeScript, ZERO @angular.
 * Plain class; the port is supplied via constructor injection (wired in
 * infrastructure). Depends inward on the port + domain only.
 */
import { User } from '../../domain/user.entity';
import { UserRepositoryPort } from '../ports/user-repository.port';

export class Authenticate {
  constructor(private readonly users: UserRepositoryPort) {}

  execute(username: string, password: string): Promise<User | null> {
    return this.users.findByCredentials(username, password);
  }
}
