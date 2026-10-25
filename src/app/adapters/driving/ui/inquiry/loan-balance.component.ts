import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/domain/user.entity';
import { LoanInfo } from '../../../../core/domain/loan.entity';
import { LoanInfoPort } from '../../../../ports/driving/loan-info.port';
import { LOAN_INFO_PORT } from '../../../../configuration/tokens';

/**
 * ADAPTERS · DRIVING · UI — DETERMINISTIC answer component (same for every user
 * type). Every figure comes from the LoanInfoPort — the UI does not compute money.
 */
@Component({
  selector: 'app-loan-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Loan balance & maturity</div>
      <h3>Your loan at a glance</h3>

      <div class="progress">
        <div class="progress__bar" [style.width.%]="loan.paidPercent"></div>
      </div>
      <p class="muted small">
        {{ loan.paidPercent }}% paid off — {{ loan.currentBalance | currency }} remaining of
        {{ loan.originalAmount | currency }}
      </p>

      <div class="grid two">
        <div class="stat">
          <span class="stat__label">Current balance</span>
          <span class="stat__value">{{ loan.currentBalance | currency }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Original amount</span>
          <span class="stat__value">{{ loan.originalAmount | currency }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Interest rate</span>
          <span class="stat__value">{{ loan.interestRate }}%</span>
        </div>
        <div class="stat">
          <span class="stat__label">Maturity date</span>
          <span class="stat__value">{{ loan.maturityDate | date: 'longDate' }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .two {
        grid-template-columns: repeat(2, 1fr);
        margin-top: 1rem;
      }
      .progress {
        height: 12px;
        background: var(--surface-muted);
        border-radius: 999px;
        overflow: hidden;
        margin: 0.6rem 0 0.3rem;
        border: 1px solid var(--border);
      }
      .progress__bar {
        height: 100%;
        background: var(--brand);
        border-radius: 999px;
        transition: width 0.6s ease;
      }
      .small {
        font-size: 0.85rem;
      }
    `,
  ],
})
export class LoanBalanceComponent implements OnInit {
  @Input({ required: true }) user!: User;
  private loanInfoPort: LoanInfoPort = inject(LOAN_INFO_PORT);

  loan!: LoanInfo;

  ngOnInit(): void {
    this.loan = this.loanInfoPort.getLoanInfo(this.user);
  }
}
