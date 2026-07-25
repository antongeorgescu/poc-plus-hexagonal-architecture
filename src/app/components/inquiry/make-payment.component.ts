import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import {
  PaymentService,
  PaymentApplyTo,
  PaymentResult,
} from '../../bll/payment.service';

/**
 * Presentation component for making an (extra) payment. It collects input and
 * delegates all business rules to the BLL PaymentService. After a successful
 * submit it shows a short confirmation with a reference number.
 */
@Component({
  selector: 'app-make-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Make a payment</div>

      @if (!result()?.success) {
        <h3>Make an extra payment</h3>
        <p class="muted">
          Pay down your balance faster. Extra payments applied to principal reduce
          the interest you'll pay over the life of your loan.
        </p>

        <div class="context">
          <div class="stat">
            <span class="stat__label">Current balance</span>
            <span class="stat__value">{{ user.currentBalance | currency }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Interest rate</span>
            <span class="stat__value">{{ user.interestRate }}%</span>
          </div>
        </div>

        <form class="pay" (ngSubmit)="submit()">
          <label class="field">
            <span>Payment amount</span>
            <div class="money">
              <span class="money__sign">$</span>
              <input
                type="number"
                name="amount"
                min="1"
                step="1"
                [max]="user.currentBalance"
                [(ngModel)]="amount"
                required
              />
            </div>
          </label>

          <label class="field">
            <span>Funding source</span>
            <select name="source" [(ngModel)]="fundingSource" required>
              @for (src of sources; track src) {
                <option [value]="src">{{ src }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span>Effective date</span>
            <input type="date" name="date" [(ngModel)]="effectiveDate" required />
          </label>

          <fieldset class="field apply">
            <span>Apply payment to</span>
            <label class="radio">
              <input type="radio" name="applyTo" value="PRINCIPAL" [(ngModel)]="applyTo" />
              Principal (reduce balance)
            </label>
            <label class="radio">
              <input type="radio" name="applyTo" value="NEXT_INSTALLMENT" [(ngModel)]="applyTo" />
              Next installment
            </label>
          </fieldset>

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }

          <button class="btn" type="submit">Submit Payment</button>
        </form>
      } @else {
        <div class="confirm">
          <div class="confirm__check">✓</div>
          <h3>Payment submitted</h3>
          <p>
            Thank you, {{ user.firstName }}. Your payment of
            <strong>{{ result()!.amount | currency }}</strong> was received and
            {{ result()!.message | lowercase }}
          </p>
          <div class="receipt">
            <div class="receipt__row">
              <span class="muted">Reference #</span>
              <strong class="ref">{{ result()!.referenceNumber }}</strong>
            </div>
            <div class="receipt__row">
              <span class="muted">Effective date</span>
              <span>{{ result()!.effectiveDate | date: 'longDate' }}</span>
            </div>
            <div class="receipt__row">
              <span class="muted">Projected new balance</span>
              <span>{{ result()!.projectedBalance | currency }}</span>
            </div>
          </div>
          <p class="muted small">
            Please keep your reference number for your records. A confirmation
            email is on its way.
          </p>
          <button class="btn btn--ghost" (click)="reset()">Make another payment</button>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .context {
        display: flex;
        gap: 2rem;
        margin: 0.8rem 0 1rem;
      }
      .pay {
        display: grid;
        gap: 1rem;
        max-width: 420px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-muted);
        border: none;
        padding: 0;
        margin: 0;
      }
      input,
      select {
        padding: 0.6rem 0.7rem;
        border: 1.5px solid var(--border);
        border-radius: 10px;
        font-size: 1rem;
        font-family: inherit;
        width: 100%;
      }
      input:focus,
      select:focus {
        outline: none;
        border-color: var(--brand);
        box-shadow: 0 0 0 3px rgba(11, 92, 171, 0.12);
      }
      .money {
        position: relative;
      }
      .money__sign {
        position: absolute;
        left: 0.7rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
      }
      .money input {
        padding-left: 1.5rem;
      }
      .apply {
        gap: 0.5rem;
      }
      .radio {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 400;
        color: var(--text);
      }
      .radio input {
        width: auto;
      }
      .error {
        color: var(--bad);
        font-size: 0.9rem;
        margin: 0;
      }
      .btn {
        justify-self: start;
      }
      /* Confirmation */
      .confirm {
        text-align: center;
        padding: 0.5rem 0 0.2rem;
      }
      .confirm__check {
        width: 52px;
        height: 52px;
        margin: 0 auto 0.6rem;
        border-radius: 50%;
        background: rgba(22, 163, 74, 0.12);
        color: var(--good);
        font-size: 1.6rem;
        line-height: 52px;
        font-weight: 700;
      }
      .receipt {
        text-align: left;
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.9rem 1rem;
        margin: 1rem auto;
        max-width: 380px;
      }
      .receipt__row {
        display: flex;
        justify-content: space-between;
        padding: 0.35rem 0;
      }
      .ref {
        font-family: 'Consolas', 'Courier New', monospace;
        letter-spacing: 0.03em;
        color: var(--brand-dark);
      }
      .small {
        font-size: 0.82rem;
      }
    `,
  ],
})
export class MakePaymentComponent implements OnInit {
  @Input({ required: true }) user!: User;
  private payments = inject(PaymentService);

  amount = 0;
  fundingSource = '';
  effectiveDate = '';
  applyTo: PaymentApplyTo = 'PRINCIPAL';
  sources: string[] = [];

  readonly result = signal<PaymentResult | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.sources = this.payments.getFundingSources();
    this.fundingSource = this.sources[0] ?? '';
    this.amount = this.payments.suggestExtraPayment(this.user);
    this.effectiveDate = this.today();
  }

  submit(): void {
    const res = this.payments.submitPayment(this.user, {
      amount: Number(this.amount),
      fundingSource: this.fundingSource,
      effectiveDate: this.effectiveDate,
      applyTo: this.applyTo,
    });
    if (res.success) {
      this.error.set(null);
      this.result.set(res);
    } else {
      this.error.set(res.message);
    }
  }

  reset(): void {
    this.result.set(null);
    this.error.set(null);
    this.amount = this.payments.suggestExtraPayment(this.user);
    this.effectiveDate = this.today();
  }

  private today(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
