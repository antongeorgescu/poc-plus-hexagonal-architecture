/**
 * ADAPTERS · DRIVEN (secondary) — API user repository.
 * The core DRIVES this adapter through the UserRepositoryPort. It IMPLEMENTS that
 * driven port by calling the local API (server/api.mjs), which owns the SQLite
 * file. The browser never holds the database, the passwords or a SQL runtime.
 */
import { UserRepositoryPort } from '../../ports/driven/user-repository.port';
import { User } from '../../core/domain/user.entity';

export class ApiUserRepository implements UserRepositoryPort {
  async findByCredentials(username: string, password: string): Promise<User | null> {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    if (res.status === 401) return null; // rejected credentials are a value, not an error
    if (!res.ok) throw new Error(`Login request failed (${res.status})`);
    return ((await res.json()) as { user: User }).user;
  }
}
