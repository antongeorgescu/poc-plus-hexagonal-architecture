/**
 * APPLICATION — Use case. PURE TypeScript, ZERO @angular.
 * Profile + rule-derived standing come from the Borrower entity.
 */
import { User } from '../../domain/user.entity';
import {
  buildBorrowerProfile,
  currentContact,
  BorrowerProfile,
  ProfileContact,
} from '../../domain/borrower.entity';

export class GetBorrowerProfile {
  execute(user: User): BorrowerProfile {
    return buildBorrowerProfile(user);
  }

  contact(user: User): ProfileContact {
    return currentContact(user);
  }
}
