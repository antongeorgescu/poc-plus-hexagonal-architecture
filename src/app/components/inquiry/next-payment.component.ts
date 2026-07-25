import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/**
 * DETERMINISTIC inquiry component — identical for every user type.
 * Answers "when is my next payment due and how much?"
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
          <span class="stat__value">{{ user.nextPaymentAmount | currency }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Due date</span>
          <span class="stat__value">{{ user.nextPaymentDate | date: 'longDate' }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Regular monthly payment</span>
          <span class="stat__value">{{ user.monthlyPayment | currency }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Payments made</span>
          <span class="stat__value">{{ user.paymentsMade }}</span>
        </div>
      </div>
      @if (user.nextPaymentAmount > user.monthlyPayment) {
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
export class NextPaymentComponent {
  @Input({ required: true }) user!: User;
}
