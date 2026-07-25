import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/** TYPE 3 (Delinquency grade 2) — human support & free counseling. */
@Component({
  selector: 'app-debt-counseling',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">We're on your side</div>
      <h3>Talk to someone who can help</h3>
      <p class="muted">
        A dedicated account advocate can walk you through your options — free and
        with no impact to your credit for reaching out.
      </p>
      <div class="contact">
        <div class="stat">
          <span class="stat__label">Call your advocate</span>
          <span class="stat__value">1-800-555-0142</span>
        </div>
        <div class="stat">
          <span class="stat__label">Hours</span>
          <span class="stat__value">Mon–Fri, 8am–8pm</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn">Schedule a callback</button>
        <button class="btn btn--ghost">Free credit counseling</button>
      </div>
    </section>
  `,
  styles: [
    `
      .contact {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin: 1rem 0;
      }
      .actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class DebtCounselingComponent {
  @Input({ required: true }) user!: User;
}
