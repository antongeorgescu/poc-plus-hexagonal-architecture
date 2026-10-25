import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/domain/user.entity';
import { PaymentApplyTo, PaymentHistory } from '../../../../core/domain/payment.entity';
import { PaymentPort } from '../../../../ports/driving/payment.port';
import { PAYMENT_PORT } from '../../../../configuration/tokens';

/**
 * ADAPTERS · DRIVING · UI — DETERMINISTIC answer component (PAYMENT_HISTORY).
 * Lists the payments the borrower has made, newest first. The ordering and the
 * running total come from PaymentPort.getHistory() — this component only renders
 * them. It reloads whenever the session user is replaced, so a payment made on the
 * Make Payment card shows up here without asking again.
 */
@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Payment history</div>
      <h3>Your payments, newest first</h3>

      @if (loading()) {
        <p class="muted">Loading your payments…</p>
      } @else if (!history()?.success) {
        <p class="error">{{ history()?.message }}</p>
      } @else if (history()!.count === 0) {
        <p class="muted">No payments have been recorded on your account yet.</p>
      } @else {
        <p class="summary">
          <strong>{{ history()!.count }}</strong>
          {{ history()!.count === 1 ? 'payment' : 'payments' }} totalling
          <strong>{{ history()!.totalPaid | currency }}</strong>
        </p>

        <div class="table-wrap">
          <table class="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th class="num">Amount</th>
                <th>Applied to</th>
                <th>Paid from</th>
                <th class="num">Balance after</th>
              </tr>
            </thead>
            <tbody>
              @for (p of history()!.entries; track p.id) {
                <tr>
                  <td>{{ p.effectiveDate | date: 'mediumDate' }}</td>
                  <td class="ref">{{ p.referenceNumber }}</td>
                  <td class="num">{{ p.amount | currency }}</td>
                  <td>{{ appliedTo(p.applyTo) }}</td>
                  <td>{{ p.fundingSource }}</td>
                  <td class="num">{{ p.balanceAfter | currency }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .summary {
        margin: 0.25rem 0 0.75rem;
      }
      .error {
        color: var(--bad, #b42318);
      }
      .table-wrap {
        overflow-x: auto;
      }
      .ledger {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }
      .ledger th,
      .ledger td {
        padding: 0.5rem 0.6rem;
        text-align: left;
        white-space: nowrap;
        border-bottom: 1px solid var(--border);
      }
      .ledger th {
        font-size: 0.72rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--muted, #5b6b7d);
      }
      .ledger .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .ledger tbody tr:first-child td {
        background: var(--surface-muted);
      }
      .ref {
        font-family: 'Consolas', 'Courier New', monospace;
        letter-spacing: 0.02em;
        color: var(--brand-dark);
      }
    `,
  ],
})
export class PaymentHistoryComponent implements OnChanges {
  @Input({ required: true }) user!: User;
  private paymentPort: PaymentPort = inject(PAYMENT_PORT);

  readonly history = signal<PaymentHistory | null>(null);
  readonly loading = signal(true);
  /** Guards against an older response overwriting a newer one. */
  private requestId = 0;

  // Runs on first render and again whenever a new `user` object arrives (e.g. after
  // a payment replaces it in the session), so the list is never stale.
  async ngOnChanges(): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true);
    const history = await this.paymentPort.getHistory(this.user);
    if (id !== this.requestId) return;
    this.history.set(history);
    this.loading.set(false);
  }

  appliedTo(applyTo: PaymentApplyTo): string {
    return applyTo === 'PRINCIPAL' ? 'Principal' : 'Installment';
  }
}
