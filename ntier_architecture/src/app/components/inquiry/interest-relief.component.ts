import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';
import { InquiryService } from '../../services/inquiry.service';

/**
 * PERSONALIZED inquiry component (LIFE_EVENT). Handles the "I just had my
 * first child — do I qualify for interest rate relief?" flow. The eligibility
 * outcome and the size of the rate reduction depend on the user type.
 */
@Component({
  selector: 'app-interest-relief',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Life event · interest rate relief</div>
      <h3>Congratulations on your new arrival! 🍼</h3>

      @if (result.eligible) {
        <span class="pill pill--good">You qualify</span>
        <p class="muted">{{ result.reason }}</p>
        <div class="grid two">
          <div class="stat">
            <span class="stat__label">Current rate</span>
            <span class="stat__value">{{ user.interestRate }}%</span>
          </div>
          <div class="stat">
            <span class="stat__label">Proposed rate</span>
            <span class="stat__value good">{{ result.proposedRate }}%</span>
          </div>
          <div class="stat">
            <span class="stat__label">Est. monthly interest savings</span>
            <span class="stat__value">{{ result.estimatedMonthlySavings | currency }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">New dependent benefit</span>
            <span class="stat__value">Family Rate Relief</span>
          </div>
        </div>
        <button class="btn">Apply the new rate</button>
      } @else {
        <span class="pill pill--warn">Not yet eligible</span>
        <p class="muted">{{ result.reason }}</p>
        <button class="btn btn--ghost">See how to become eligible</button>
      }
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
      .pill {
        margin-bottom: 0.6rem;
      }
    `,
  ],
})
export class InterestReliefComponent implements OnInit {
  @Input({ required: true }) user!: User;
  private inquiry = inject(InquiryService);

  result!: ReturnType<InquiryService['checkRateReliefEligibility']>;

  ngOnInit(): void {
    this.result = this.inquiry.checkRateReliefEligibility(this.user);
  }
}
