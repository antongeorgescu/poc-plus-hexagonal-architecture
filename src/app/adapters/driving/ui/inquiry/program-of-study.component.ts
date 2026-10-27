import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/domain/user.entity';

/**
 * ADAPTERS · DRIVING · UI — DETERMINISTIC answer component (PROGRAM_OF_STUDY).
 * Shows the program the borrower's loan financed, with every attribute the program
 * catalogue holds. Nothing is computed or decided here: the program arrives on the
 * User (assembled from loan.program_id → program_of_study), so this only formats it.
 */
@Component({
  selector: 'app-program-of-study',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Program of study</div>

      @if (user.program; as p) {
        <h3>{{ p.name }}</h3>
        <p class="muted">{{ p.description }}</p>

        <div class="grid two">
          <div class="stat">
            <span class="stat__label">Program code</span>
            <span class="stat__value code">{{ p.code }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Field of study</span>
            <span class="stat__value">{{ p.fieldOfStudy }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Credential</span>
            <span class="stat__value">{{ p.credentialLevel }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Length</span>
            <span class="stat__value">{{ duration(p.durationMonths) }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Tuition (per year)</span>
            <span class="stat__value">{{ p.annualTuition | currency: 'CAD' : 'symbol-narrow' : '1.0-0' }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Co-op work terms</span>
            <span class="stat__value">{{ p.coOp ? 'Included' : 'Not included' }}</span>
          </div>
        </div>
      } @else {
        <!-- A session saved before programs existed has no program on it. -->
        <h3>{{ user.programOfStudy }}</h3>
        <p class="muted">
          The full program details are not available in this session. Sign out and back in to load them.
        </p>
      }
    </section>
  `,
  styles: [
    `
      .two {
        grid-template-columns: repeat(2, 1fr);
        margin-top: 1rem;
      }
      .code {
        font-family: 'Consolas', 'Courier New', monospace;
        letter-spacing: 0.02em;
      }
    `,
  ],
})
export class ProgramOfStudyComponent {
  @Input({ required: true }) user!: User;

  /** 48 → "48 months (4 years)"; 18 → "18 months". Display only. */
  duration(months: number): string {
    if (months % 12 !== 0) return `${months} months`;
    const years = months / 12;
    return `${months} months (${years} ${years === 1 ? 'year' : 'years'})`;
  }
}
