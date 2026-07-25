import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

/**
 * Business Logic Layer (BLL) — payment processing.
 *
 * This layer is deliberately UI-agnostic: it validates a payment request,
 * applies the business rules, generates a confirmation reference, and returns
 * a result. The presentation component (MakePaymentComponent) only collects
 * input and renders whatever the BLL returns.
 */

export type PaymentApplyTo = 'PRINCIPAL' | 'NEXT_INSTALLMENT';

export interface PaymentRequest {
  amount: number;
  fundingSource: string;
  effectiveDate: string; // ISO yyyy-mm-dd
  applyTo: PaymentApplyTo;
}

export interface PaymentResult {
  success: boolean;
  referenceNumber?: string;
  message: string;
  amount?: number;
  projectedBalance?: number;
  effectiveDate?: string;
}

/** Deterministic snapshot of the borrower's payment posture. */
export interface PaymentSnapshot {
  monthlyPayment: number;
  nextPaymentAmount: number;
  nextPaymentDate: string;
  paymentsMade: number;
  paymentsMissed: number;
  onTimeStreak: number;
  isPastDue: boolean;
  pastDueAmount: number;
  suggestedExtraPayment: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  /** Business rule: minimum accepted payment. */
  private readonly minPayment = 1;

  /** Suggested extra payment = 10% of current balance, rounded to $25. */
  suggestExtraPayment(user: User): number {
    const raw = user.currentBalance * 0.1;
    return Math.max(this.minPayment, Math.round(raw / 25) * 25);
  }

  /** Deterministic payment posture for the logged-in user. */
  getPaymentSnapshot(user: User): PaymentSnapshot {
    const isPastDue = user.nextPaymentAmount > user.monthlyPayment;
    return {
      monthlyPayment: user.monthlyPayment,
      nextPaymentAmount: user.nextPaymentAmount,
      nextPaymentDate: user.nextPaymentDate,
      paymentsMade: user.paymentsMade,
      paymentsMissed: user.paymentsMissed,
      onTimeStreak: user.onTimeStreak,
      isPastDue,
      pastDueAmount: isPastDue
        ? Math.round((user.nextPaymentAmount - user.monthlyPayment) * 100) / 100
        : 0,
      suggestedExtraPayment: this.suggestExtraPayment(user),
    };
  }

  /** Funding sources a borrower could pay from (mock). */
  getFundingSources(): string[] {
    return ['Checking ••••1234', 'Savings ••••5678', 'Debit card ••••9012'];
  }

  /**
   * Validates and "processes" a payment. Returns a confirmation with a
   * reference number, or a failure with the reason.
   */
  submitPayment(user: User, request: PaymentRequest): PaymentResult {
    if (!Number.isFinite(request.amount) || request.amount < this.minPayment) {
      return {
        success: false,
        message: `Please enter a payment of at least $${this.minPayment}.`,
      };
    }
    if (request.amount > user.currentBalance) {
      return {
        success: false,
        message: `The amount exceeds your current balance of $${user.currentBalance.toLocaleString()}. Enter your payoff amount or less.`,
      };
    }
    if (!request.fundingSource) {
      return { success: false, message: 'Please choose a funding source.' };
    }

    const projectedBalance =
      Math.round((user.currentBalance - request.amount) * 100) / 100;

    return {
      success: true,
      referenceNumber: this.generateReference(request.effectiveDate),
      amount: request.amount,
      projectedBalance,
      effectiveDate: request.effectiveDate,
      message:
        request.applyTo === 'PRINCIPAL'
          ? 'Your extra payment has been applied directly to your principal balance.'
          : 'Your payment has been applied to your next scheduled installment.',
    };
  }

  /** Reference format: PMT-YYYYMMDD-XXXXXX (uppercase alphanumeric). */
  private generateReference(effectiveDate: string): string {
    const datePart = (effectiveDate || '').replace(/-/g, '') || 'PENDING';
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PMT-${datePart}-${suffix}`;
  }
}
