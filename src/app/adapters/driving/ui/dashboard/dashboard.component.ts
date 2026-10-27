import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SessionStore } from '../../../../configuration/session.store';
import { INQUIRY_PORT, PERSONALIZATION_PORT } from '../../../../configuration/tokens';
import { WelcomeContent } from '../../../../ports/driving/personalization.port';
import { InquiryResult } from '../../../../ports/driving/inquiry.port';
import { USER_TYPE_LABEL } from '../../../../core/domain/user.entity';

// Answer components
import { NextPaymentComponent } from '../inquiry/next-payment.component';
import { LoanBalanceComponent } from '../inquiry/loan-balance.component';
import { MakePaymentComponent } from '../inquiry/make-payment.component';
import { UpdateProfileComponent } from '../inquiry/update-profile.component';
import { PaymentHistoryComponent } from '../inquiry/payment-history.component';
import { ProfileHistoryComponent } from '../inquiry/profile-history.component';
import { ProgramOfStudyComponent } from '../inquiry/program-of-study.component';
import { JobOpportunitiesComponent } from '../inquiry/job-opportunities.component';
import { InterestReliefComponent } from '../inquiry/interest-relief.component';
import { RepaymentOptionsComponent } from '../inquiry/repayment-options.component';

// Shared presentational marker
import { AiBadgeComponent } from '../shared/ai-badge.component';
import { GeneralHelpComponent } from '../inquiry/general-help.component';

// Always-on shared cards
import { AccountSummaryComponent } from '../summary/account-summary.component';
import { ChatInsightsComponent } from '../summary/chat-insights.component';

/**
 * Are these the same question, ignoring case, padding and trailing punctuation?
 * Used to decide whether a repeat ask should scroll to the existing card.
 */
function sameQuestion(a: string, b: string): boolean {
  const norm = (t: string) =>
    t.toLowerCase().replace(/\s+/g, ' ').replace(/[?!.\s]+$/, '').trim();
  return norm(a) === norm(b);
}

/**
 * One answered inquiry in the dashboard history.
 *
 * `queries` is a LIST because a topic gets exactly one card. Every answer
 * component takes only `[user]` — none receives the question text — so two
 * questions on the same topic would render byte-identical cards. Instead the
 * card is reused and each new phrasing is recorded on it, so nothing the
 * borrower asked disappears.
 */
interface InquiryEntry {
  id: number;
  queries: string[];
  result: InquiryResult;
}

/**
 * ADAPTERS · DRIVING · UI — Dashboard orchestrator. A primary adapter: it reads
 * the authenticated borrower from the SessionStore, asks the cognitive InquiryPort
 * to PROPOSE a category, and renders the matching answer component. Note that
 * InquiryPort and PaymentPort are indistinguishable from out here — both are just
 * driving ports. Every authoritative value inside those components is fetched
 * through a deterministic driving port; the CLL never computes it.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AiBadgeComponent,
    AccountSummaryComponent,
    ChatInsightsComponent,
    NextPaymentComponent,
    LoanBalanceComponent,
    MakePaymentComponent,
    UpdateProfileComponent,
    PaymentHistoryComponent,
    ProfileHistoryComponent,
    ProgramOfStudyComponent,
    JobOpportunitiesComponent,
    InterestReliefComponent,
    RepaymentOptionsComponent,
    GeneralHelpComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private session = inject(SessionStore);
  private inquiry = inject(INQUIRY_PORT);
  private personalization = inject(PERSONALIZATION_PORT);
  private router = inject(Router);

  readonly typeLabels = USER_TYPE_LABEL;
  readonly user = this.session.currentUser;

  /**
   * Welcome copy is now FETCHED, not computed: PersonalizationPort is async
   * because the copy may come from Azure OpenAI. The template already guarded
   * this with `@if (welcome(); as w)`, so a null first paint costs nothing.
   */
  readonly welcome = signal<WelcomeContent | null>(null);

  inquiryText = '';
  readonly entries = signal<InquiryEntry[]>([]);
  readonly highlightedId = signal<number | null>(null);
  /** True while the cognitive port is classifying — a real call has latency. */
  readonly asking = signal(false);
  private nextId = 0;

  constructor() {
    effect(
      () => {
        const u = this.user();
        if (!u) {
          this.welcome.set(null);
          return;
        }
        void this.personalization
          .getWelcome(u)
          .then((w) => this.welcome.set(w))
          .catch(() => this.welcome.set(null));
      },
      { allowSignalWrites: true }
    );
  }

  async ask(): Promise<void> {
    const query = this.inquiryText.trim();
    if (!query || this.asking()) return;
    // Clear the box immediately so the UI stays responsive across the round trip.
    this.inquiryText = '';
    this.asking.set(true);
    try {
      // CLL proposes the category; the answer components obtain the numbers.
      const result = await this.inquiry.classify(query);

      // ONE CARD PER TOPIC. Every answer component is rendered from `[user]`
      // alone, so a second card for the same category would be an exact copy —
      // clutter, not information.
      //
      // But a repeat must never be silent either: collapsing on category while
      // showing only the FIRST question made later questions look ignored,
      // which was especially bad for GENERAL, the catch-all. So the existing
      // card absorbs the new phrasing and is flashed, and every question the
      // borrower asked stays visible on it.
      const existing = this.entries().find((e) => e.result.category === result.category);
      if (existing) {
        const isRepeat = existing.queries.some((q) => sameQuestion(q, query));
        if (!isRepeat) {
          this.entries.update((list) =>
            list.map((e) =>
              e.id === existing.id ? { ...e, queries: [...e.queries, query] } : e
            )
          );
        }
        this.scrollToEntry(existing.id);
        return;
      }

      this.entries.update((list) => [
        { id: this.nextId++, queries: [query], result },
        ...list,
      ]);
    } finally {
      this.asking.set(false);
    }
  }

  private scrollToEntry(id: number): void {
    this.highlightedId.set(id);
    setTimeout(() => {
      document
        .getElementById('response-' + id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    setTimeout(() => {
      if (this.highlightedId() === id) {
        this.highlightedId.set(null);
      }
    }, 1800);
  }

  clearHistory(): void {
    this.entries.set([]);
    this.inquiryText = '';
  }

  logout(): void {
    this.session.clear();
    this.router.navigate(['/login']);
  }
}
