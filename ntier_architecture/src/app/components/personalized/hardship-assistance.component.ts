import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/** TYPE 3 (Delinquency grade 2) — forbearance / deferment / catch-up plan. */
@Component({
  selector: 'app-hardship-assistance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Assistance available</div>
      <h3>Let's find a plan that works</h3>
      <p class="muted">
        Your account is past due by {{ user.nextPaymentAmount | currency }}. You
        have options — none of these require a payment today.
      </p>
      <div class="options">
        <button class="option">
          <span class="option__title">Pause payments (forbearance)</span>
          <span class="option__desc">Temporarily stop payments for up to 3 months.</span>
        </button>
        <button class="option">
          <span class="option__title">Reduced payment plan</span>
          <span class="option__desc">Lower your payment based on your income.</span>
        </button>
        <button class="option">
          <span class="option__title">Catch-up over time</span>
          <span class="option__desc">Spread the past-due amount across future payments.</span>
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .options {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        margin-top: 0.9rem;
      }
      .option {
        text-align: left;
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.75rem 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        transition: border-color 0.15s ease;
      }
      .option:hover {
        border-color: var(--brand);
      }
      .option__title {
        font-weight: 600;
        color: var(--brand);
      }
      .option__desc {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
    `,
  ],
})
export class HardshipAssistanceComponent {
  @Input({ required: true }) user!: User;
}
