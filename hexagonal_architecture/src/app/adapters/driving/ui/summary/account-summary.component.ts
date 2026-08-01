import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/domain/user.entity';
import { AccountSummary } from '../../../../ports/driving/account-summary.port';
import { ACCOUNT_SUMMARY_PORT } from '../../../../configuration/tokens';

/**
 * ADAPTERS · DRIVING · UI — Always-on shared card. Holds NO business logic: the
 * summary arrives through the cognitive AccountSummaryPort, behind which the
 * cognitive region calls the deterministic driving ports (ProfilePort /
 * LoanInfoPort / PaymentPort). CLL narrates; the BLL computes.
 */
@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (summary; as vm) {
    <section class="card summary">
      <div class="summary__top">
        <div>
          <div class="card__eyebrow">Account summary</div>
          <h3>Your loan summary</h3>
        </div>
        <span
          class="pill"
          [class.pill--good]="vm.profile.standingTone === 'good'"
          [class.pill--warn]="vm.profile.standingTone === 'warn'"
          [class.pill--bad]="vm.profile.standingTone === 'bad'"
        >
          {{ vm.profile.standingLabel }}
        </span>
      </div>

      <div class="block">
        <h4>Your loan</h4>
        <p>{{ vm.loanSentence }}</p>
        <div class="facts">
          <div class="stat">
            <span class="stat__label">Original amount</span>
            <span class="stat__value">{{ vm.loan.originalAmount | currency }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Current balance</span>
            <span class="stat__value">{{ vm.loan.currentBalance | currency }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Interest rate</span>
            <span class="stat__value">{{ vm.loan.interestRate }}%</span>
          </div>
          <div class="stat">
            <span class="stat__label">Paid off</span>
            <span class="stat__value">{{ vm.loan.paidPercent }}%</span>
          </div>
        </div>
        <div class="progress" [attr.aria-label]="vm.loan.paidPercent + '% paid off'">
          <div class="progress__bar" [style.width.%]="vm.loan.paidPercent"></div>
        </div>
      </div>

      <div class="block">
        <h4>Your payments</h4>
        <p>{{ vm.paymentsSentence }}</p>
        <div class="facts">
          <div class="stat">
            <span class="stat__label">Monthly payment</span>
            <span class="stat__value">{{ vm.payment.monthlyPayment | currency }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Payments made</span>
            <span class="stat__value">{{ vm.payment.paymentsMade }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Payments missed</span>
            <span class="stat__value">{{ vm.payment.paymentsMissed }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Next payment</span>
            <span class="stat__value">
              {{ vm.payment.nextPaymentAmount | currency }}
              <small class="muted">· {{ vm.payment.nextPaymentDate | date: 'mediumDate' }}</small>
            </span>
          </div>
        </div>
      </div>

      <div class="block block--standing" [class]="'tone-' + vm.profile.standingTone">
        <h4>Your standing</h4>
        <p>{{ vm.profile.standingSummary }}</p>
        <p class="muted small">
          Reference credit score on file: <strong>{{ vm.profile.creditScore }}</strong>.
        </p>
      </div>
    </section>
    } @else {
      <section class="card summary" aria-busy="true">
        <div class="card__eyebrow">Account summary</div>
        <h3>Your loan summary</h3>
        <p class="muted">Preparing your summary…</p>
      </section>
    }
  `,
  styles: [
    `
      .summary__top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 0.4rem;
      }
      .block {
        padding: 1rem 0;
        border-top: 1px solid var(--border);
      }
      .block h4 {
        color: var(--brand-dark);
        margin-bottom: 0.35rem;
      }
      .block p {
        margin: 0 0 0.8rem;
      }
      .facts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.9rem;
      }
      .progress {
        height: 10px;
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 999px;
        overflow: hidden;
        margin-top: 0.9rem;
      }
      .progress__bar {
        height: 100%;
        background: var(--brand);
        border-radius: 999px;
        transition: width 0.6s ease;
      }
      .block--standing {
        border-radius: 12px;
        padding: 0.9rem 1rem;
        margin-top: 1rem;
        border: 1px solid var(--border);
      }
      .tone-good {
        background: rgba(22, 163, 74, 0.08);
      }
      .tone-warn {
        background: rgba(217, 119, 6, 0.08);
      }
      .tone-bad {
        background: rgba(220, 38, 38, 0.08);
      }
      .small {
        font-size: 0.85rem;
      }
      small {
        font-size: 0.8rem;
      }
    `,
  ],
})
export class AccountSummaryComponent implements OnInit {
  @Input({ required: true }) user!: User;
  private summaryService = inject(ACCOUNT_SUMMARY_PORT);

  /**
   * Null until the cognitive port resolves. The port is async because the model
   * behind it may be remote — so the card renders a placeholder first rather
   * than assuming the narration is available synchronously.
   */
  summary: AccountSummary | null = null;

  async ngOnInit(): Promise<void> {
    this.summary = await this.summaryService.summarize(this.user);
  }
}
