/**
 * PORTS · DRIVING (inbound / primary) — ProfilePort.
 * PURE TypeScript, ZERO @angular. Read the borrower profile / current contact
 * details, or apply a validated profile update. Validation lives in the core.
 */
import { User } from '../../core/domain/user.entity';
import {
  BorrowerProfile,
  ProfileContact,
  ProfileUpdateResult,
} from '../../core/domain/borrower.entity';

export interface ProfilePort {
  getProfile(user: User): BorrowerProfile;
  getContact(user: User): ProfileContact;
  updateProfile(user: User, contact: ProfileContact): ProfileUpdateResult;
}
