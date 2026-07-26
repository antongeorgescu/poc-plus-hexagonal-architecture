/**
 * APPLICATION — Use case. PURE TypeScript, ZERO @angular.
 * Delegates the authoritative money math to the Loan entity.
 */
import { User } from '../../domain/user.entity';
import { buildLoanInfo, LoanInfo } from '../../domain/loan.entity';

export class GetLoanInfo {
  execute(user: User): LoanInfo {
    return buildLoanInfo(user);
  }
}
