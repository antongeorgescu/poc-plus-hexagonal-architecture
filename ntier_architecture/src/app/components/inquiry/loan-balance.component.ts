import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/**
 * DETERMINISTIC inquiry component — identical for every user type.
 * Answers "what's my balance and when's the maturity date?"
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
        <div class="progress__bar" [style.width.%]="paidPercent"></div>
      </div>
      <p class="muted small">
        {{ paidPercent }}% paid off — {{ user.currentBalance | currency }} remaining of
        {{ user.originalAmount | currency }}
      </p>

      <div class="grid two">
        <div class="stat">
          <span class="stat__label">Current balance</span>
          <span class="stat__value">{{ user.currentBalance | currency }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Original amount</span>
          <span class="stat__value">{{ user.originalAmount | currency }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Interest rate</span>
          <span class="stat__value">{{ user.interestRate }}%</span>
        </div>
        <div class="stat">
          <span class="stat__label">Maturity date</span>
          <span class="stat__value">{{ user.maturityDate | date: 'longDate' }}</span>
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
export class LoanBalanceComponent {
  @Input({ required: true }) user!: User;

  get paidPercent(): number {
    if (!this.user.originalAmount) return 0;
    const paid =
      (this.user.originalAmount - this.user.currentBalance) /
      this.user.originalAmount;
    return Math.max(0, Math.min(100, Math.round(paid * 100)));
  }
}
