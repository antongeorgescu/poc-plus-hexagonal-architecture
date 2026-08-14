import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ADAPTERS · DRIVING · UI — "AI-assisted" marker.
 *
 * Purely presentational. It marks the parts of the page whose CONTENT was
 * produced by the cognitive region (CLL) rather than computed by the
 * deterministic one (BLL), so a viewer can tell at a glance which words came
 * from a model.
 *
 * WHERE IT APPEARS, AND WHY:
 *   · Inquiry answers — the dashboard renders it from `InquiryResult.deterministic`,
 *     which the core stamps from the injected `DETERMINISM_POLICY`. It is therefore
 *     DATA-DRIVEN: flip a category in that map and the badge follows automatically,
 *     with no change here.
 *   · Always-on cards (welcome, account summary, conversation insights) — these are
 *     not inquiry categories, so they carry the badge directly; they are served by
 *     cognitive driving ports unconditionally.
 *
 * What the badge does NOT mean: that the numbers beside it came from a model.
 * Every authoritative figure on this page is fetched from a deterministic
 * driving port regardless of who wrote the sentence around it.
 */
@Component({
  selector: 'app-ai-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="ai-badge" [title]="hint" aria-label="AI-assisted content">
      <span class="ai-badge__icon" aria-hidden="true">🤖</span>
      <span class="ai-badge__text">{{ label }}</span>
    </span>
  `,
  styles: [
    `
      .ai-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        border: 1px dashed rgba(124, 58, 237, 0.45);
        background: rgba(124, 58, 237, 0.08);
        color: #6d28d9;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-transform: none;
        vertical-align: middle;
        cursor: help;
      }
      .ai-badge__icon {
        font-size: 0.85rem;
        line-height: 1;
      }
    `,
  ],
})
export class AiBadgeComponent {
  /** Short caption. Override for a more specific claim. */
  @Input() label = 'AI-assisted';

  /** Tooltip text — states the limit, not just the fact. */
  @Input() hint =
    'Wording produced by the cognitive layer (CLL). Every amount, date and ' +
    'eligibility outcome shown here is computed by the deterministic layer (BLL).';
}
