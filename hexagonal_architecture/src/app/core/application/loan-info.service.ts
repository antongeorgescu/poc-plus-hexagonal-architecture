/**
 * CORE · APPLICATION — Loan info use case.
 * PURE TypeScript, ZERO @angular. IMPLEMENTS the driving port (LoanInfoPort).
 * Delegates the authoritative money math to the Loan entity.
 */
import { LoanInfoPort } from '../../ports/driving/loan-info.port';
import { User } from '../domain/user.entity';
import { buildLoanInfo, LoanInfo } from '../domain/loan.entity';

export class LoanInfoService implements LoanInfoPort {
  getLoanInfo(user: User): LoanInfo {
    return buildLoanInfo(user);
  }
}
