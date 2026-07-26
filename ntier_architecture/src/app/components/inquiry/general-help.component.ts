import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/** Fallback inquiry component when the text doesn't match a known category. */
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
        <li>Options if you're struggling to make payments</li>
        <li>Interest rate relief after a qualifying life event</li>
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
