import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SessionStore } from '../../../../configuration/session.store';
import { INQUIRY_PORT, PERSONALIZATION_PORT } from '../../../../configuration/tokens';
import { WelcomeContent } from '../../../../ports/driving/personalization.port';
import { InquiryResult } from '../../../../core/domain/inquiry';
import { USER_TYPE_LABEL } from '../../../../core/domain/user.entity';

// Answer components
import { NextPaymentComponent } from '../inquiry/next-payment.component';
import { LoanBalanceComponent } from '../inquiry/loan-balance.component';
import { MakePaymentComponent } from '../inquiry/make-payment.component';
import { UpdateProfileComponent } from '../inquiry/update-profile.component';
import { JobOpportunitiesComponent } from '../inquiry/job-opportunities.component';
import { InterestReliefComponent } from '../inquiry/interest-relief.component';

// Shared presentational marker
import { AiBadgeComponent } from '../shared/ai-badge.component';
import { GeneralHelpComponent } from '../inquiry/general-help.component';

// Always-on shared cards
import { AccountSummaryComponent } from '../summary/account-summary.component';
import { ChatInsightsComponent } from '../summary/chat-insights.component';

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

      const existing = this.entries().find(
        (e) => e.result.category === result.category
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
