/**
 * ADAPTERS · DRIVEN (secondary) — API profile repository.
 * IMPLEMENTS ProfileRepositoryPort by POSTing an accepted contact update to the
 * local API, which updates borrower_contact and logs the reference in one
 * transaction, and by reading the log back from GET /api/profile/history. Any
 * failure — rejected, or API down — comes back as a `success: false` value so the
 * core never sees an exception.
 */
import {
  ProfileHistoryOutcome,
  ProfileRecord,
  ProfileRecordOutcome,
  ProfileRepositoryPort,
} from '../../ports/driven/profile-repository.port';

export class ApiProfileRepository implements ProfileRepositoryPort {
  async save(profile: ProfileRecord): Promise<ProfileRecordOutcome> {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const body = (await res.json().catch(() => null)) as ProfileRecordOutcome | null;
      if (res.ok && body?.success) return body;
      return {
        success: false,
        message: body?.message ?? `The update could not be saved (${res.status}).`,
      };
    } catch {
      return {
        success: false,
        message: 'The profile service is unavailable. Your changes were not saved.',
      };
    }
  }

  async history(username: string): Promise<ProfileHistoryOutcome> {
    try {
      const res = await fetch(`/api/profile/history?username=${encodeURIComponent(username)}`);
      const body = (await res.json().catch(() => null)) as ProfileHistoryOutcome | null;
      if (res.ok && body?.success) return body;
      return {
        success: false,
        message: body?.message ?? `Your update history could not be loaded (${res.status}).`,
        entries: [],
      };
    } catch {
      return {
        success: false,
        message: 'The profile service is unavailable. Your update history could not be loaded.',
        entries: [],
      };
    }
  }
}
