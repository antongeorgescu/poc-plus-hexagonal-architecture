import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../domain/user.entity';
import { ProfileContact, ProfileUpdateResult } from '../../domain/borrower.entity';
import { GET_BORROWER_PROFILE, UPDATE_PROFILE } from '../../infrastructure/tokens';

/**
 * UI — DETERMINISTIC answer component. Pre-fills from the GetBorrowerProfile use
 * case and delegates all validation/persistence to the UpdateProfile use case.
 */
@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Update your profile</div>

      @if (!result()?.success) {
        <h3>Update your contact details</h3>
        <p class="muted">
          Keep your information current so we can reach you about your loan.
          Leave a field unchanged to keep its current value.
        </p>

        <form class="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Email address</span>
            <input type="email" name="email" [(ngModel)]="email" placeholder="you@example.com" />
          </label>
          <label class="field">
            <span>Phone number</span>
            <input type="tel" name="phone" [(ngModel)]="phone" placeholder="(555) 123-4567" />
          </label>
          <label class="field">
            <span>Mailing address</span>
            <input
              type="text"
              name="mailingAddress"
              [(ngModel)]="mailingAddress"
              placeholder="Street, City, State ZIP"
            />
          </label>

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }

          <button class="btn" type="submit">Save changes</button>
        </form>
      } @else {
        <div class="confirm">
          <div class="confirm__check">✓</div>
          <h3>Profile updated</h3>
          <p>Thanks, {{ user.firstName }} — your contact details are up to date.</p>
          <div class="receipt">
            <div class="receipt__row">
              <span class="muted">Confirmation #</span>
              <strong class="ref">{{ result()!.referenceNumber }}</strong>
            </div>
            <div class="receipt__row">
              <span class="muted">Email</span>
              <span>{{ result()!.updated!.email }}</span>
            </div>
            <div class="receipt__row">
              <span class="muted">Phone</span>
              <span>{{ result()!.updated!.phone || '—' }}</span>
            </div>
            <div class="receipt__row">
              <span class="muted">Mailing address</span>
              <span>{{ result()!.updated!.mailingAddress }}</span>
            </div>
          </div>
          <button class="btn btn--ghost" (click)="reset()">Edit again</button>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .form {
        display: grid;
        gap: 1rem;
        max-width: 440px;
        margin-top: 0.9rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-muted);
      }
      input {
        padding: 0.6rem 0.7rem;
        border: 1.5px solid var(--border);
        border-radius: 10px;
        font-size: 1rem;
        font-family: inherit;
        width: 100%;
      }
      input:focus {
        outline: none;
        border-color: var(--brand);
        box-shadow: 0 0 0 3px rgba(11, 92, 171, 0.12);
      }
      .error {
        color: var(--bad);
        font-size: 0.9rem;
        margin: 0;
      }
      .btn {
        justify-self: start;
      }
      .confirm {
        text-align: center;
        padding: 0.5rem 0 0.2rem;
      }
      .confirm__check {
        width: 52px;
        height: 52px;
        margin: 0 auto 0.6rem;
        border-radius: 50%;
        background: rgba(22, 163, 74, 0.12);
        color: var(--good);
        font-size: 1.6rem;
        line-height: 52px;
        font-weight: 700;
      }
      .receipt {
        text-align: left;
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.9rem 1rem;
        margin: 1rem auto;
        max-width: 400px;
      }
      .receipt__row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.35rem 0;
      }
      .ref {
        font-family: 'Consolas', 'Courier New', monospace;
        letter-spacing: 0.03em;
        color: var(--brand-dark);
      }
    `,
  ],
})
export class UpdateProfileComponent implements OnInit {
  @Input({ required: true }) user!: User;
  private getBorrowerProfile = inject(GET_BORROWER_PROFILE);
  private updateProfile = inject(UPDATE_PROFILE);

  email = '';
  phone = '';
  mailingAddress = '';

  readonly result = signal<ProfileUpdateResult | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.prefill();
  }

  submit(): void {
    const res = this.updateProfile.execute(this.user, {
      email: this.email,
      phone: this.phone,
      mailingAddress: this.mailingAddress,
    });
    if (res.success) {
      this.error.set(null);
      this.result.set(res);
    } else {
      this.error.set(res.message);
    }
  }

  reset(): void {
    this.result.set(null);
    this.error.set(null);
    this.prefill();
  }

  private prefill(): void {
    const current: ProfileContact = this.getBorrowerProfile.contact(this.user);
    this.email = current.email;
    this.phone = current.phone;
    this.mailingAddress = current.mailingAddress;
  }
}
