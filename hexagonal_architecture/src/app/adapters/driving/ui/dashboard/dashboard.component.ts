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

/** One answered inquiry in the dashboard history. */
interface InquiryEntry {
  id: number;
  query: string;
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

      // De-duplicate, but only where a second card would genuinely be a copy.
      //
      // A DETERMINISTIC topic renders the same component with the same figures
      // however the borrower phrased it, so re-asking scrolls to the card that
      // is already on screen.
      //
      // A NON-deterministic topic must compare the QUESTION, not just the
      // category. GENERAL in particular is the catch-all for anything the
      // classifier could not place — collapsing on category alone silently
      // swallowed every unmatched question after the first, scrolling the
      // borrower back to someone else's question instead of answering theirs.
      const existing = this.entries().find(
        (e) =>
          e.result.category === result.category &&
          (result.deterministic || sameQuestion(e.query, query))
      );
      if (existing) {
        this.scrollToEntry(existing.id);
        return;
      }

      this.entries.update((list) => [{ id: this.nextId++, query, result }, ...list]);
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
