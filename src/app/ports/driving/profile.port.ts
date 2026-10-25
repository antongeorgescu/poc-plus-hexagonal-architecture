/**
 * PORTS · DRIVING (inbound / primary) — ProfilePort.
 * PURE TypeScript, ZERO @angular. Read the borrower profile / current contact
 * details, or apply a validated profile update. Validation lives in the core.
 */
import { User } from '../../core/domain/user.entity';
import {
  BorrowerProfile,
  ProfileContact,
  ProfileUpdateHistory,
  ProfileUpdateResult,
} from '../../core/domain/borrower.entity';

export interface ProfilePort {
  getProfile(user: User): BorrowerProfile;
  getContact(user: User): ProfileContact;
  /** The contact updates this borrower has made, newest first, with the fields each one changed. */
  getUpdateHistory(user: User): Promise<ProfileUpdateHistory>;
  /**
   * Validate, decide and RECORD a contact update. Async because storing it leaves
   * the process; a rejected or failed write comes back as `success: false`.
   */
  updateProfile(user: User, contact: ProfileContact): Promise<ProfileUpdateResult>;
}
