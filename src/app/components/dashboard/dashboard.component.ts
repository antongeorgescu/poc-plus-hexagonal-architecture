import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { InquiryService } from '../../services/inquiry.service';
import {
  PersonalizationService,
  WelcomeContent,
} from '../../services/personalization.service';
import { InquiryResult } from '../../models/inquiry.model';
import { USER_TYPE_LABEL } from '../../models/user.model';

/** One answered inquiry in the dashboard history. */
interface InquiryEntry {
  id: number;
  query: string;
  result: InquiryResult;
}

// Inquiry (answer) components
import { NextPaymentComponent } from '../inquiry/next-payment.component';
import { LoanBalanceComponent } from '../inquiry/loan-balance.component';
import { MakePaymentComponent } from '../inquiry/make-payment.component';
import { UpdateProfileComponent } from '../inquiry/update-profile.component';
import { JobOpportunitiesComponent } from '../inquiry/job-opportunities.component';
import { InterestReliefComponent } from '../inquiry/interest-relief.component';
import { GeneralHelpComponent } from '../inquiry/general-help.component';

// Shared components shown for every user
import { AccountSummaryComponent } from '../summary/account-summary.component';
import { ChatInsightsComponent } from '../summary/chat-insights.component';

// Personalized (per-user-type) components
import { RewardsComponent } from '../personalized/rewards.component';
import { RefinanceOfferComponent } from '../personalized/refinance-offer.component';
import { AutopayComponent } from '../personalized/autopay.component';
import { BudgetTipsComponent } from '../personalized/budget-tips.component';
import { HardshipAssistanceComponent } from '../personalized/hardship-assistance.component';
import { DebtCounselingComponent } from '../personalized/debt-counseling.component';

/**
 * The orchestrator. After login it:
 *  1. Shows a themed welcome + polite "how can we help" question per user type.
 *  2. Takes a free-text inquiry, classifies it (mock), and COMPOSES the UI:
 *       - the inquiry-answer component(s) for the matched category
 *       - PLUS, for non-deterministic inquiries, the personalized component
 *         set for the user's type.
 *     Deterministic inquiries (payment / balance) show the SAME components
 *     for every user type.
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
    RewardsComponent,
    RefinanceOfferComponent,
    AutopayComponent,
    BudgetTipsComponent,
    HardshipAssistanceComponent,
    DebtCounselingComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private inquiry = inject(InquiryService);
  private personalization = inject(PersonalizationService);
  private router = inject(Router);

  readonly typeLabels = USER_TYPE_LABEL;
  readonly user = this.auth.currentUser;

  readonly welcome = computed<WelcomeContent | null>(() => {
    const u = this.user();
    return u ? this.personalization.getWelcome(u) : null;
  });

  inquiryText = '';
  /** History of answered inquiries, kept newest-first for display. */
  readonly entries = signal<InquiryEntry[]>([]);
  /** Entry to briefly highlight after scrolling to an existing answer. */
  readonly highlightedId = signal<number | null>(null);
  private nextId = 0;

  /**
   * Classifies the question. If the resulting component is already shown,
   * scrolls to it instead of duplicating; otherwise prepends it (newest on top).
   */
  ask(): void {
    const query = this.inquiryText.trim();
    if (!query) return;
    const result = this.inquiry.classify(query);
    this.inquiryText = '';

    const existing = this.entries().find(
      (e) => e.result.category === result.category
    );
    if (existing) {
      this.scrollToEntry(existing.id);
      return;
    }

    this.entries.update((list) => [
      { id: this.nextId++, query, result },
      ...list,
    ]);
  }

  /** Smoothly scrolls to an existing answer and flashes it. */
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
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
