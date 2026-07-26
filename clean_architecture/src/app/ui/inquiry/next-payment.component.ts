import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../domain/user.entity';
import { PaymentSnapshot } from '../../domain/payment.entity';
import { GET_PAYMENT_SNAPSHOT } from '../../infrastructure/tokens';

/**
 * UI — DETERMINISTIC answer component (same for every user type).
 * Obtains its authoritative values ONLY through the GetPaymentSnapshot use case.
 */
@Component({
  selector: 'app-next-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Next payment</div>
      <h3>Your next payment</h3>
      <div class="grid two">
        <div class="stat">
          <span class="stat__label">Amount due</span>
          <span class="stat__value">{{ snapshot.nextPaymentAmount | currency }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Due date</span>
          <span class="stat__value">{{ snapshot.nextPaymentDate | date: 'longDate' }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Regular monthly payment</span>
          <span class="stat__value">{{ snapshot.monthlyPayment | currency }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Payments made</span>
          <span class="stat__value">{{ snapshot.paymentsMade }}</span>
        </div>
      </div>
      @if (snapshot.isPastDue) {
        <p class="note">
          This amount includes past-due balance in addition to your regular
          monthly payment.
        </p>
      }
      <button class="btn">Make a payment</button>
    </section>
  `,
  styles: [
    `
      .two {
        grid-template-columns: repeat(2, 1fr);
        margin: 1rem 0;
      }
      .note {
        color: var(--warn);
        font-size: 0.9rem;
      }
      .btn {
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class NextPaymentComponent implements OnInit {
  @Input({ required: true }) user!: User;
  private getPaymentSnapshot = inject(GET_PAYMENT_SNAPSHOT);

  snapshot!: PaymentSnapshot;

  ngOnInit(): void {
    this.snapshot = this.getPaymentSnapshot.execute(this.user);
  }
}
