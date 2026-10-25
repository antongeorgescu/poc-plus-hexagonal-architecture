import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { INQUIRY_POLICY_CONFIG } from '../../../../configuration/tokens';
import { InquiryPolicy } from '../../../../core/cognitive/inquiry.policy';
import { InquiryCategory } from '../../../../core/domain/inquiry.type';

/** One row of the table — a category with everything the policy says about it. */
interface PolicyRow {
  category: InquiryCategory;
  label: string;
  deterministic: boolean;
  description: string;
}

/**
 * ADAPTERS · DRIVING · UI — Determinism policy configuration (read-only).
 * A primary adapter that renders a BUSINESS SETTING: the map bound at the
 * composition root and applied by the core's InquiryService.
 *
 * It injects the policy by TOKEN, exactly as every other UI component consumes a
 * port — it never imports `configuration/inquiry.policy.config.ts` directly. The
 * screen decides nothing: flip a value at the composition root and this table,
 * the AI badges and the answer framing all move together, because they read the
 * same map.
 */
@Component({
  selector: 'app-determinism-policy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="policy">
      <div class="policy__card card">
        <div class="card__eyebrow">Configuration · read-only</div>
        <h1>Determinism policy</h1>
        <p class="muted">
          The fixed, business-owned map that decides which inquiry topics are
          answered with the <strong>same components for every borrower</strong>,
          and which are personalized by the cognitive layer.
        </p>

        <div class="callout">
          <strong>The model never sees this map.</strong> A language model only
          <em>proposes</em> a topic; the core stamps the flag below onto that
          proposal. A wrong proposal can pick the wrong topic — it can never move
          a topic across the deterministic line.
        </div>

        <div class="stats">
          <div class="stat">
            <span class="stat__label">Topics</span>
            <span class="stat__value">{{ rows().length }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Deterministic (BLL)</span>
            <span class="stat__value stat__value--good">{{ deterministicCount() }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Cognitive (CLL)</span>
            <span class="stat__value stat__value--warn">{{ cognitiveCount() }}</span>
          </div>
        </div>

        <div class="table" role="table" aria-label="Determinism policy by topic">
          <div class="row row--head" role="row">
            <span role="columnheader">Category</span>
            <span role="columnheader">Label shown to the borrower</span>
            <span role="columnheader">Handled by</span>
          </div>

          @for (row of rows(); track row.category) {
            <div
              class="row"
              role="row"
              [class.row--bll]="row.deterministic"
              [class.row--cll]="!row.deterministic"
            >
              <span class="row__key" role="cell"><code>{{ row.category }}</code></span>
              <span class="row__label" role="cell">{{ row.label }}</span>
              <span role="cell">
                <span
                  class="pill"
                  [class.pill--good]="row.deterministic"
                  [class.pill--warn]="!row.deterministic"
                >
                  {{ row.deterministic ? 'Deterministic · BLL' : 'Cognitive · CLL' }}
                </span>
              </span>
              <p class="row__desc" role="cell">{{ row.description }}</p>
            </div>
          }
        </div>

        <div class="actions">
          <button class="btn" type="button" (click)="toggleEditNotice()">
            ✎ Edit Configuration
          </button>
          <a class="btn btn--ghost" routerLink="/login">← Back to sign in</a>
        </div>

        @if (showEditNotice()) {
          <p class="notice">
            <strong>Not wired up in this proof of concept.</strong> In a real
            deployment this button would rebind the policy at runtime — and
            because the badges, the answer framing and the gate all read the
            <em>same</em> map, flipping one row here would change the borrower's
            experience immediately, with no code change and no redeploy.
          </p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .policy {
        /* Rule colour for the stats strip and the table grid. Deliberately
           darker than the global --border (#dbe3ec), which is tuned for large
           card outlines and disappears when used for thin grid lines. Scoped
           here so no other screen's borders shift. */
        --rule: #97a6b8;
        display: flex;
        justify-content: center;
        padding: 2rem 1rem 3rem;
      }
      .policy__card {
        width: min(920px, 100%);
      }
      h1 {
        margin: 0.35rem 0 0.4rem;
      }
      .callout {
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-left: 3px solid var(--brand);
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 1rem 0;
        font-size: 0.9rem;
      }
      /* One bordered strip with dividers between the cells, mirroring the table
         below — three separately-bordered boxes with gaps between them read as
         unrelated chips rather than as one summary of the same policy. */
      .stats {
        display: flex;
        flex-wrap: wrap;
        margin: 1rem 0 1.2rem;
        border: 1px solid var(--rule);
        border-radius: 10px;
        overflow: hidden;
      }
      .stat {
        flex: 1 1 140px;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        /* Matches the table's 0.9rem cell padding so the columns line up. */
        padding: 0.7rem 0.9rem;
      }
      .stat + .stat {
        border-left: 1px solid var(--rule);
      }
      .stat__label {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .stat__value {
        font-size: 1.4rem;
        font-weight: 700;
      }
      .stat__value--good {
        color: var(--good);
      }
      .stat__value--warn {
        color: var(--warn);
      }
      /* ONE bordered container holding header + rows. Previously each row was a
         separate rounded card with a gap between them, which left the column
         headings floating over nothing — there was no continuous column to read
         them against. A single frame with a filled header band and hairline row
         dividers ties each heading to the column beneath it. */
      .table {
        /* Declared ONCE so the header and every data row share identical tracks.
           The third track is fixed rather than auto: pills differ in width, and
           an auto track would size to its own row's pill, nudging the first two
           columns out of alignment from row to row. */
        --policy-cols: minmax(130px, 0.9fr) minmax(150px, 1.3fr) 190px;
        border: 1px solid var(--rule);
        border-radius: 10px;
        overflow: hidden;
      }
      .row {
        display: grid;
        grid-template-columns: var(--policy-cols);
        gap: 0.35rem 1rem;
        align-items: center;
        padding: 0.75rem 0.9rem;
        border-top: 1px solid var(--rule);
      }
      .row:hover:not(.row--head) {
        background: var(--surface-muted);
      }
      /* Cells stretch to the row's full height so a divider drawn on them runs
         edge to edge instead of only as tall as its own text. */
      .row > span {
        align-self: stretch;
        display: flex;
        align-items: center;
      }
      /* Column dividers through the BODY, continuing the header's compartments
         down the table so every heading has a visible column under it. */
      .row > span + span {
        border-left: 1px solid var(--rule);
        margin-left: -0.5rem;
        padding-left: 0.5rem;
      }
      /* Columns 1 and 3 centre — both hold discrete badges (a code chip, a
         pill), which sit better centred than ragged-left. Applied to the header
         AND the cells together so each name stays over its own column. Column 2
         is a sentence-like label and stays left-aligned. */
      .row > span:nth-child(1),
      .row > span:nth-child(3) {
        justify-content: center;
        text-align: center;
      }
      /* Inset shadow rather than a left border: a 3px border would shift this
         row's content right of its neighbours. */
      .row--cll {
        box-shadow: inset 3px 0 0 var(--warn);
      }
      .row--bll {
        box-shadow: inset 3px 0 0 var(--good);
      }
      /* Solid brand band: --surface-muted sat only a shade off the card's white
         and still read as part of the table body. A filled dark band separates
         the headings from the data unmistakably. */
      .row--head {
        background: var(--brand);
        color: #fff;
        border-top: none;
        border-bottom: none;
        padding-top: 0.65rem;
        padding-bottom: 0.65rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }
      /* Vertical rules inside the header only — they mark where each column
         starts without adding grid lines through the whole table. Translucent
         white so they read against the band rather than fighting it. */
      .row--head > span + span {
        border-left: 1px solid rgba(255, 255, 255, 0.38);
        margin-left: -0.5rem;
        padding-left: 0.5rem;
      }
      .row__key code {
        font-size: 0.82rem;
        background: var(--surface-muted);
        padding: 0.15rem 0.4rem;
        border-radius: 6px;
      }
      .row__label {
        font-weight: 600;
        font-size: 0.9rem;
      }
      .row__desc {
        grid-column: 1 / -1;
        margin: 0.1rem 0 0;
        padding-top: 0.4rem;
        border-top: 1px dashed var(--rule);
        font-size: 0.82rem;
        line-height: 1.45;
        color: var(--text-muted);
      }
      .actions {
        display: flex;
        gap: 0.6rem;
        margin-top: 1.3rem;
        flex-wrap: wrap;
        align-items: center;
      }
      .notice {
        margin: 0.9rem 0 0;
        padding: 0.7rem 0.9rem;
        font-size: 0.85rem;
        line-height: 1.5;
        background: var(--surface-muted);
        border: 1px dashed var(--border);
        border-radius: 10px;
        color: var(--text-muted);
      }
      @media (max-width: 620px) {
        /* Stacked, so the divider has to move from the side to the top. */
        .stats {
          flex-direction: column;
        }
        .stat + .stat {
          border-left: none;
          border-top: 1px solid var(--rule);
        }
        .row {
          grid-template-columns: 1fr;
        }
        /* Column headings are meaningless once the grid collapses to one column. */
        .row--head {
          display: none;
        }
      }
    `,
  ],
})
export class DeterminismPolicyComponent {
  private policy: InquiryPolicy = inject(INQUIRY_POLICY_CONFIG);

  showEditNotice = signal(false);

  /** The bound policy, flattened into one row per topic for display. */
  rows = computed<PolicyRow[]>(() =>
    (Object.keys(this.policy.determinism) as InquiryCategory[]).map((category) => ({
      category,
      label: this.policy.labels[category],
      deterministic: this.policy.determinism[category],
      description: this.policy.descriptions[category],
    }))
  );

  deterministicCount = computed(() => this.rows().filter((r) => r.deterministic).length);
  cognitiveCount = computed(() => this.rows().filter((r) => !r.deterministic).length);

  /** Deliberately inert: it demonstrates the seam, it does not change anything. */
  toggleEditNotice(): void {
    this.showEditNotice.update((shown) => !shown);
  }
}
