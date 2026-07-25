import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/** TYPE 1 (Excellent standing) — loyalty rewards & recognition. */
@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Preferred borrower</div>
      <h3>You've earned rewards 🌟</h3>
      <p class="muted">
        {{ user.onTimeStreak }} consecutive on-time payments — you're in the top
        tier of borrowers.
      </p>
      <ul class="perks">
        <li>💳 $50 statement credit for your on-time streak</li>
        <li>📉 Auto-eligible for our lowest published rates</li>
        <li>⚡ Priority support — skip the queue</li>
      </ul>
      <button class="btn">Claim rewards</button>
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
export class RewardsComponent {
  @Input({ required: true }) user!: User;
}
