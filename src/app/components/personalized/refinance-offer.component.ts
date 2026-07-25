import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/** TYPE 1 (Excellent standing) — proactive refinance / rate-cut offer. */
@Component({
  selector: 'app-refinance-offer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Exclusive offer</div>
      <h3>Refinance and save</h3>
      <p class="muted">
        Based on your excellent history, you pre-qualify for a lower rate.
      </p>
      <div class="grid two">
        <div class="stat">
          <span class="stat__label">Current rate</span>
          <span class="stat__value">{{ user.interestRate }}%</span>
        </div>
        <div class="stat">
          <span class="stat__label">Pre-qualified rate</span>
          <span class="stat__value good">{{ offeredRate }}%</span>
        </div>
      </div>
      <button class="btn">Check my refinance offer</button>
    </section>
  `,
  styles: [
    `
      .two {
        grid-template-columns: repeat(2, 1fr);
        margin: 1rem 0;
      }
      .good {
        color: var(--good);
      }
    `,
  ],
})
export class RefinanceOfferComponent {
  @Input({ required: true }) user!: User;

  get offeredRate(): number {
    return Math.max(0, Math.round((this.user.interestRate - 1.0) * 100) / 100);
  }
}
