/**
 * CORE · APPLICATION — Profile use case.
 * PURE TypeScript, ZERO @angular. IMPLEMENTS the driving port (ProfilePort).
 * Profile + rule-derived standing and contact-update validation come from the
 * Borrower entity; an accepted update is handed to the ProfileRepositoryPort to be
 * stored. This service depends only on that driven-port interface, supplied by the
 * composition root.
 */
import { ProfilePort } from '../../ports/driving/profile.port';
import { ProfileRepositoryPort } from '../../ports/driven/profile-repository.port';
import { User } from '../domain/user.entity';
import {
  applyProfileUpdate,
  buildBorrowerProfile,
  buildProfileUpdateHistory,
  currentContact,
  BorrowerProfile,
  ProfileContact,
  ProfileUpdateHistory,
  ProfileUpdateResult,
} from '../domain/borrower.entity';

export class ProfileService implements ProfilePort {
  constructor(private readonly profiles: ProfileRepositoryPort) {}

  getProfile(user: User): BorrowerProfile {
    return buildBorrowerProfile(user);
  }

  getContact(user: User): ProfileContact {
    return currentContact(user);
  }

  async getUpdateHistory(user: User): Promise<ProfileUpdateHistory> {
    const outcome = await this.profiles.history(user.username);
    // An unreadable log is reported as such — never shown as "no updates".
    if (!outcome.success) return { success: false, message: outcome.message, entries: [], count: 0 };
    return buildProfileUpdateHistory(outcome.entries);
  }

  async updateProfile(user: User, contact: ProfileContact): Promise<ProfileUpdateResult> {
    // The domain decides first; nothing is stored for a rejected update.
    const result = applyProfileUpdate(user, contact);
    if (!result.success) return result;

    const outcome = await this.profiles.save({
      username: user.username,
      referenceNumber: result.referenceNumber!,
      updated: result.updated!,
    });
    // A failed write must not be reported as a confirmed update.
    if (!outcome.success) return { success: false, message: outcome.message };

    return { ...result, updatedUser: outcome.user };
  }
}
