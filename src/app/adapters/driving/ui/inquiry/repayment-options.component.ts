import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/domain/user.entity';
import { LoanInfo } from '../../../../core/domain/loan.entity';
import { PaymentSnapshot } from '../../../../core/domain/payment.entity';
import { BorrowerProfile } from '../../../../core/domain/borrower.entity';
import { RateReliefOutcome } from '../../../../core/domain/eligibility.entity';
import { LoanInfoPort } from '../../../../ports/driving/loan-info.port';
import { PaymentPort } from '../../../../ports/driving/payment.port';
import { ProfilePort } from '../../../../ports/driving/profile.port';
import { EligibilityPort } from '../../../../ports/driving/eligibility.port';
import {
  LOAN_INFO_PORT,
  PAYMENT_PORT,
  PROFILE_PORT,
  ELIGIBILITY_PORT,
} from '../../../../configuration/tokens';

/**
 * ADAPTERS · DRIVING · UI — PERSONALIZED answer component (REPAYMENT_OPTIONS).
 *
 * Answers "what are my options?" across three scenarios: paying the loan off
 * faster, what the repayment-assistance programs require, and what an
 * interest-rate reduction takes.
 *
 * COGNITIVE by policy (`DETERMINISM_POLICY.REPAYMENT_OPTIONS = false`) because
 * what it contributes is *guidance* — which lever to consider and what the
 * conditions are. It is emphatically NOT a calculator:
 *
 *   · every figure shown comes from a deterministic driving port
 *     (LoanInfoPort · PaymentPort · ProfilePort · EligibilityPort);
 *   · the rate-relief verdict is EligibilityPort's, printed verbatim — this
 *     component never estimates eligibility;
 *   · it deliberately shows NO payoff projection. The platform has no
 *     amortization solver yet, and inventing "pay $X more, finish Y months
 *     early" in the UI is exactly the boundary violation the CLL/BLL split
 *     exists to prevent. It points at the deterministic payment flow instead.
 */
@Component({
  selector: 'app-repayment-options',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Repayment options &amp; scenarios</div>
      <h3>Three ways to change your repayment</h3>
      <p class="muted">
        Here are the levers available to you and what each one requires. Amounts
        below come from your account; eligibility is always confirmed by us, never
        estimated here.
      </p>

      <div class="opt">
        <h4>1 · Pay off faster</h4>
        <p>
          Anything you pay above your regular
          {{ payment.monthlyPayment | currency }} goes straight to principal, which
          shortens the loan. You currently have
          <strong>{{ loan.monthsToMaturity }} months</strong> remaining at
          {{ loan.interestRate }}%.
        </p>
        <div class="facts">
          <div class="stat">
            <span class="stat__label">Regular monthly payment</span>
            <span class="stat__value">{{ payment.monthlyPayment | currency }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Suggested one-off lump sum</span>
            <span class="stat__value">{{ suggested | currency }}</span>
            <small class="muted">10% of your balance — not a monthly amount</small>
          </div>
        </div>
        <p class="note">
          Your exact revised payoff date is calculated when you submit a payment —
          ask to <em>make an extra payment</em> to see the confirmed figures.
        </p>
      </div>

      <div class="opt">
        <h4>2 · Repayment assistance</h4>
        <p>
          Assistance plans can pause or reduce payments while your circumstances
          recover. Typical conditions:
        </p>
        <ul>
          <li>A documented change in income, employment or hardship</li>
          <li>Your account is not already in a discharge or default process</li>
          <li>Remaining eligibility under the plan's cumulative-time limits</li>
        </ul>
        <p class="note">
          Your account standing is currently
          <strong>{{ profile.standingLabel }}</strong>. Whether you qualify is
          decided on review — this card cannot approve anything.
        </p>
      </div>

      <div class="opt">
        <h4>3 · Interest rate relief</h4>
        @if (relief.eligible) {
          <span class="pill pill--good">You currently qualify</span>
          <p>{{ relief.reason }}</p>
          <div class="facts">
            <div class="stat">
              <span class="stat__label">Current rate</span>
              <span class="stat__value">{{ loan.interestRate }}%</span>
            </div>
            <div class="stat">
              <span class="stat__label">Proposed rate</span>
              <span class="stat__value good">{{ relief.proposedRate }}%</span>
            </div>
            <div class="stat">
              <span class="stat__label">Est. monthly interest saving</span>
              <span class="stat__value">{{ relief.estimatedMonthlySavings | currency }}</span>
            </div>
          </div>
        } @else {
          <span class="pill pill--warn">Not yet eligible</span>
          <p>{{ relief.reason }}</p>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .opt {
        padding: 0.9rem 0;
        border-top: 1px solid var(--border);
      }
      .opt h4 {
        color: var(--brand-dark);
        margin-bottom: 0.35rem;
      }
      .opt p {
        margin: 0 0 0.7rem;
      }
      .opt ul {
        margin: 0 0 0.7rem 1.1rem;
        padding: 0;
        font-size: 0.93rem;
      }
      .opt li {
        margin-bottom: 0.25rem;
      }
      .facts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.9rem;
      }
      .note {
        font-size: 0.86rem;
        color: var(--text-muted);
        margin-top: 0.7rem !important;
      }
      .stat small {
        display: block;
        font-size: 0.72rem;
        margin-top: 0.15rem;
      }
      .good {
        color: var(--good);
      }
      .pill {
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class RepaymentOptionsComponent implements OnInit {
  @Input({ required: true }) user!: User;

  private loanInfo: LoanInfoPort = inject(LOAN_INFO_PORT);
  private paymentPort: PaymentPort = inject(PAYMENT_PORT);
  private profilePort: ProfilePort = inject(PROFILE_PORT);
  private eligibility: EligibilityPort = inject(ELIGIBILITY_PORT);

  loan!: LoanInfo;
  payment!: PaymentSnapshot;
  profile!: BorrowerProfile;
  relief!: RateReliefOutcome;
  suggested = 0;

  ngOnInit(): void {
    // All deterministic, all synchronous. Nothing here is a model output.
    this.loan = this.loanInfo.getLoanInfo(this.user);
    this.payment = this.paymentPort.getSnapshot(this.user);
    this.profile = this.profilePort.getProfile(this.user);
    this.relief = this.eligibility.checkRateRelief(this.user);
    this.suggested = this.paymentPort.suggestedAmount(this.user);
  }
}
