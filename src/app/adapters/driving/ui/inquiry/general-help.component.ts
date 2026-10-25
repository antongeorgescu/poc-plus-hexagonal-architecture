import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/domain/user.entity';

/** ADAPTERS · DRIVING · UI — Fallback answer when the text doesn't match a topic. */
@Component({
  selector: 'app-general-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">General help</div>
      <h3>Here's what I can help with</h3>
      <p class="muted">
        I wasn't able to match that to a specific topic, but I can help with any
        of these. Try rephrasing, or pick one below.
      </p>
      <ul class="topics">
        <li>When your next payment is due and its amount</li>
        <li>Your loan balance and maturity date</li>
        <li>Making an extra payment toward your balance</li>
        <li>Updating your contact details</li>
      </ul>
    </section>
  `,
  styles: [
    `
      .topics {
        margin: 0.6rem 0 0;
        padding-left: 1.1rem;
        line-height: 1.9;
        color: var(--text);
      }
    `,
  ],
})
export class GeneralHelpComponent {
  @Input({ required: true }) user!: User;
}
