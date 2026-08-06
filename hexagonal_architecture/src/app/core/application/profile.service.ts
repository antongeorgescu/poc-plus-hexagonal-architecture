/**
 * CORE · APPLICATION — Profile use case.
 * PURE TypeScript, ZERO @angular. IMPLEMENTS the driving port (ProfilePort).
 * Profile + rule-derived standing and contact-update validation come from the
 * Borrower entity.
 */
import { ProfilePort } from '../../ports/driving/profile.port';
import { User } from '../domain/user.entity';
import {
  applyProfileUpdate,
  buildBorrowerProfile,
  currentContact,
  BorrowerProfile,
  ProfileContact,
  ProfileUpdateResult,
} from '../domain/borrower.entity';

export class ProfileService implements ProfilePort {
  getProfile(user: User): BorrowerProfile {
    return buildBorrowerProfile(user);
  }

  getContact(user: User): ProfileContact {
    return currentContact(user);
  }

  updateProfile(user: User, contact: ProfileContact): ProfileUpdateResult {
    return applyProfileUpdate(user, contact);
  }
}
