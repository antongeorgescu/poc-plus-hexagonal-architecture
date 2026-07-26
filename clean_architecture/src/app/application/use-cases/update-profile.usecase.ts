/**
 * APPLICATION — Use case. PURE TypeScript, ZERO @angular.
 * Contact-update validation + persistence rules live in the Borrower entity.
 */
import { User } from '../../domain/user.entity';
import {
  applyProfileUpdate,
  ProfileContact,
  ProfileUpdateResult,
} from '../../domain/borrower.entity';

export class UpdateProfile {
  execute(user: User, contact: ProfileContact): ProfileUpdateResult {
    return applyProfileUpdate(user, contact);
  }
}
