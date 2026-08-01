import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { parseIsoDate } from '../models/date.util';

export interface LoanInfo {
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  maturityDate: string;
  /** Whole-percent of the original principal already repaid (0..100). */
  paidPercent: number;
  /** Whole months remaining until maturity (never negative). */
  monthsToMaturity: number;
}

/**
 * BLL — deterministic collector of loan information for the logged-in user.
 * Pure arithmetic over the authoritative record; no narration, no cognition.
 */
@Injectable({ providedIn: 'root' })
export class LoanInfoService {
  getLoanInfo(user: User): LoanInfo {
    return {
      originalAmount: user.originalAmount,
      currentBalance: user.currentBalance,
      interestRate: user.interestRate,
      maturityDate: user.maturityDate,
      paidPercent: this.paidPercent(user),
      monthsToMaturity: this.monthsToMaturity(user.maturityDate),
    };
  }

  private paidPercent(user: User): number {
    if (!user.originalAmount) return 0;
    const paid = (user.originalAmount - user.currentBalance) / user.originalAmount;
    return Math.max(0, Math.min(100, Math.round(paid * 100)));
  }

  private monthsToMaturity(maturityDate: string): number {
    const now = new Date();
    const maturity = parseIsoDate(maturityDate);
    const months =
      (maturity.getFullYear() - now.getFullYear()) * 12 +
      (maturity.getMonth() - now.getMonth());
    return Math.max(0, months);
  }
}
