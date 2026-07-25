import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

/** TYPE 2 (Delinquency grade 1) — light-touch budgeting guidance. */
@Component({
  selector: 'app-budget-tips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Budgeting help</div>
      <h3>Small changes, steadier payments</h3>
      <p class="muted">
        Your monthly payment is {{ user.monthlyPayment | currency }}. Here are a
        few ways borrowers like you stay ahead:
      </p>
      <ul class="tips">
        <li>Split your payment in two to match your paycheck cadence</li>
        <li>Set aside {{ halfPayment | currency }} every two weeks</li>
        <li>Consider a graduated repayment plan if income is variable</li>
      </ul>
      <button class="btn btn--ghost">Explore repayment plans</button>
    </section>
  `,
  styles: [
    `
      .tips {
        margin: 0.6rem 0 1rem;
        padding-left: 1.1rem;
        line-height: 1.8;
      }
    `,
  ],
})
export class BudgetTipsComponent {
  @Input({ required: true }) user!: User;

  get halfPayment(): number {
    return Math.round((this.user.monthlyPayment / 2) * 100) / 100;
  }
}
