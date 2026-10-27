import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/domain/user.entity';
import { ContactField, ProfileUpdateHistory } from '../../../../core/domain/borrower.entity';
import { describeActor } from '../../../../core/domain/actor.utility';
import { ProfilePort } from '../../../../ports/driving/profile.port';
import { PROFILE_PORT } from '../../../../configuration/tokens';

/**
 * ADAPTERS · DRIVING · UI — DETERMINISTIC answer component (PROFILE_HISTORY).
 * Lists the contact updates the borrower has made, newest first, and marks the
 * fields each one changed. The ordering and the changed-field comparison come from
 * ProfilePort.getUpdateHistory() — this component only renders them. It reloads
 * whenever the session user is replaced, so an update saved on the Update Profile
 * card shows up here without asking again.
 */
@Component({
  selector: 'app-profile-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Profile update history</div>
      <h3>Changes to your contact details, newest first</h3>

      @if (loading()) {
        <p class="muted">Loading your updates…</p>
      } @else if (!history()?.success) {
        <p class="error">{{ history()?.message }}</p>
      } @else if (history()!.count === 0) {
        <p class="muted">You haven't updated your contact details yet.</p>
      } @else {
        <p class="summary">
          <strong>{{ history()!.count }}</strong>
          {{ history()!.count === 1 ? 'update' : 'updates' }} on record
        </p>

        <ol class="timeline">
          @for (u of history()!.entries; track u.id) {
            <li class="update">
              <div class="update__head">
                <span class="update__when">{{ u.recordedAt | date: 'medium' }}</span>
                <span class="ref">{{ u.referenceNumber }}</span>
              </div>
              <div class="update__by">Recorded by {{ recordedBy(u.createdBy) }}</div>
              @for (f of fields; track f.key) {
                <div class="update__row" [class.update__row--changed]="isChanged(u.changed, f.key)">
                  <span class="update__label">{{ f.label }}</span>
                  <span class="update__value">{{ u[f.key] || '—' }}</span>
                  @if (isChanged(u.changed, f.key)) {
                    <span class="tag">Changed</span>
                  }
                </div>
              }
              @if (u.changed === null) {
                <p class="note">Earliest update on record — the details as saved then.</p>
              }
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: [
    `
      .summary {
        margin: 0.25rem 0 0.75rem;
      }
      .error {
        color: var(--bad, #b42318);
      }
      .timeline {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }
      .update {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.7rem 0.9rem;
        background: var(--surface);
      }
      .update:first-child {
        background: var(--surface-muted);
      }
      .update__head {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.4rem;
        font-size: 0.85rem;
      }
      .update__when {
        font-weight: 600;
      }
      .update__by {
        margin: -0.2rem 0 0.4rem;
        font-size: 0.8rem;
        color: var(--muted, #5b6b7d);
      }
      .update__row {
        display: grid;
        grid-template-columns: 7.5rem 1fr auto;
        gap: 0.6rem;
        align-items: baseline;
        padding: 0.2rem 0;
        font-size: 0.9rem;
      }
      .update__row--changed .update__value {
        font-weight: 600;
      }
      .update__label {
        font-size: 0.72rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--muted, #5b6b7d);
      }
      .update__value {
        overflow-wrap: anywhere;
      }
      .tag {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--brand-dark);
        border: 1px solid var(--brand);
        border-radius: 999px;
        padding: 0 0.5rem;
      }
      .note {
        margin: 0.4rem 0 0;
        font-size: 0.8rem;
        color: var(--muted, #5b6b7d);
      }
      .ref {
        font-family: 'Consolas', 'Courier New', monospace;
        letter-spacing: 0.02em;
        color: var(--brand-dark);
      }
    `,
  ],
})
export class ProfileHistoryComponent implements OnChanges {
  @Input({ required: true }) user!: User;
  private profilePort: ProfilePort = inject(PROFILE_PORT);

  readonly fields: { key: ContactField; label: string }[] = [
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'mailingAddress', label: 'Mailing address' },
  ];

  readonly history = signal<ProfileUpdateHistory | null>(null);
  readonly loading = signal(true);
  /** Guards against an older response overwriting a newer one. */
  private requestId = 0;

  // Runs on first render and again whenever a new `user` object arrives (e.g. after
  // an update replaces it in the session), so the list is never stale.
  async ngOnChanges(): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true);
    const history = await this.profilePort.getUpdateHistory(this.user);
    if (id !== this.requestId) return;
    this.history.set(history);
    this.loading.set(false);
  }

  /** 'You' for the borrower's own updates, 'Agent <id>' for staff-assisted ones. */
  recordedBy(createdBy: string): string {
    return describeActor(createdBy, this.user.username);
  }

  isChanged(changed: ContactField[] | null, field: ContactField): boolean {
    return changed !== null && changed.includes(field);
  }
}
