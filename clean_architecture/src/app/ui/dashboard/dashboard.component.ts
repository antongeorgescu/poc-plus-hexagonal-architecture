import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SessionStore } from '../../infrastructure/session.store';
import { INQUIRY_SERVICE, PERSONALIZATION_SERVICE } from '../../infrastructure/tokens';
import { WelcomeContent } from '../../adapters/cll/personalization.service';
import { InquiryResult } from '../../domain/inquiry';
import { USER_TYPE_LABEL } from '../../domain/user.entity';

// Answer components
import { NextPaymentComponent } from '../inquiry/next-payment.component';
import { LoanBalanceComponent } from '../inquiry/loan-balance.component';
import { MakePaymentComponent } from '../inquiry/make-payment.component';
import { UpdateProfileComponent } from '../inquiry/update-profile.component';
import { JobOpportunitiesComponent } from '../inquiry/job-opportunities.component';
import { InterestReliefComponent } from '../inquiry/interest-relief.component';
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
 * UI — Dashboard orchestrator (controller/presenter role). It reads the
 * authenticated borrower from the SessionStore, asks the CLL InquiryService to
 * PROPOSE a category, and renders the matching answer component. Every
 * authoritative value inside those components is fetched through use cases —
 * the CLL never computes it.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  private inquiry = inject(INQUIRY_SERVICE);
  private personalization = inject(PERSONALIZATION_SERVICE);
  private router = inject(Router);

  readonly typeLabels = USER_TYPE_LABEL;
  readonly user = this.session.currentUser;

  readonly welcome = computed<WelcomeContent | null>(() => {
    const u = this.user();
    return u ? this.personalization.getWelcome(u) : null;
  });

  inquiryText = '';
  readonly entries = signal<InquiryEntry[]>([]);
  readonly highlightedId = signal<number | null>(null);
  private nextId = 0;

  ask(): void {
    const query = this.inquiryText.trim();
    if (!query) return;
    // CLL proposes the category; the answer components obtain the numbers.
    const result = this.inquiry.classify(query);
    this.inquiryText = '';

    const existing = this.entries().find(
      (e) => e.result.category === result.category
    );
    if (existing) {
      this.scrollToEntry(existing.id);
      return;
    }

    this.entries.update((list) => [{ id: this.nextId++, query, result }, ...list]);
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
