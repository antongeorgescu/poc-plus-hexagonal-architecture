import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/** TYPE 2 (Delinquency grade 1) — nudge to enroll in autopay. */
@Component({
  selector: 'app-autopay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Stay on track</div>
      <h3>Never miss a payment again</h3>
      <p class="muted">
        You've missed {{ user.paymentsMissed }} payment(s). Enrolling in autopay
        helps you avoid late fees — and earns a rate discount.
      </p>
      <ul class="perks">
        <li>✅ Payments made automatically on the due date</li>
        <li>📉 0.25% interest rate reduction while enrolled</li>
        <li>🔔 Reminders 3 days before each draft</li>
      </ul>
      <button class="btn">Enroll in autopay</button>
    </section>
  `,
  styles: [
    `
      .perks {
        list-style: none;
        padding: 0;
        margin: 0.8rem 0 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .perks li {
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.6rem 0.8rem;
        font-size: 0.92rem;
      }
    `,
  ],
})
export class AutopayComponent {
  @Input({ required: true }) user!: User;
}
