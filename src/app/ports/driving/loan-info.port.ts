/**
 * PORTS · DRIVING (inbound / primary) — LoanInfoPort.
 * PURE TypeScript, ZERO @angular. The interface any driver calls to obtain the
 * authoritative loan snapshot (balances, paid-%, months-to-maturity).
 */
import { User } from '../../core/domain/user.entity';
import { LoanInfo } from '../../core/domain/loan.entity';

export interface LoanInfoPort {
  getLoanInfo(user: User): LoanInfo;
}
