/**
 * CONFIGURATION — Composition root (the ports-and-adapters wiring).
 * This is the ONE place that knows every concrete class. It:
 *   (a) binds DRIVEN adapters to driven-port tokens,
 *   (b) constructs application services (injecting driven ports) and binds them
 *       to DRIVING-port tokens,
 *   (c) binds the CLL primary adapters, which drive the core through the SAME
 *       driving-port tokens as the UI.
 *
 * Swapping an adapter (a real DB, a real AI-backed CLL) is a change here only.
 * SEAM: primary adapters depend on driving ports; the core depends on driven
 * ports. "The CLL proposes, the core disposes."
 */
import { Provider } from '@angular/core';

// Driven (secondary) adapters
import { CsvUserRepository } from '../adapters/driven/csv-user.repository';
import { InMemoryKnowledgeBase } from '../adapters/driven/in-memory-knowledge-base';
import { InMemoryChatHistory } from '../adapters/driven/in-memory-chat-history';

// CLL (primary) adapters
import { InquiryService } from '../adapters/driving/cll/inquiry.service';
import { PersonalizationService } from '../adapters/driving/cll/personalization.service';
import { ChatInsightsService } from '../adapters/driving/cll/chat-insights.service';
import { AccountSummaryService } from '../adapters/driving/cll/account-summary.service';

// Application services (implement the driving ports)
import { AuthenticateService } from '../core/application/authenticate.service';
import { PaymentService } from '../core/application/payment.service';
import { LoanInfoService } from '../core/application/loan-info.service';
import { ProfileService } from '../core/application/profile.service';
import { EligibilityService } from '../core/application/eligibility.service';

// Port interfaces (for typing the factory dependencies)
import { UserRepositoryPort } from '../ports/driven/user-repository.port';
import { KnowledgeBasePort } from '../ports/driven/knowledge-base.port';
import { ChatHistoryPort } from '../ports/driven/chat-history.port';
import { ProfilePort } from '../ports/driving/profile.port';
import { LoanInfoPort } from '../ports/driving/loan-info.port';
import { PaymentPort } from '../ports/driving/payment.port';

import {
  AUTHENTICATE_PORT,
  PAYMENT_PORT,
  LOAN_INFO_PORT,
  PROFILE_PORT,
  ELIGIBILITY_PORT,
  USER_REPOSITORY_PORT,
  KNOWLEDGE_BASE_PORT,
  CHAT_HISTORY_PORT,
  INQUIRY_SERVICE,
  PERSONALIZATION_SERVICE,
  CHAT_INSIGHTS_SERVICE,
  ACCOUNT_SUMMARY_SERVICE,
} from './tokens';

export const hexagonalProviders: Provider[] = [
  // --- (a) DRIVEN adapters bound to their driven-port tokens (core drives OUT) ---
  { provide: USER_REPOSITORY_PORT, useFactory: () => new CsvUserRepository() },
  { provide: KNOWLEDGE_BASE_PORT, useFactory: () => new InMemoryKnowledgeBase() },
  { provide: CHAT_HISTORY_PORT, useFactory: () => new InMemoryChatHistory() },

  // --- (b) Application services bound to DRIVING-port tokens (the way IN) ---
  {
    provide: AUTHENTICATE_PORT,
    useFactory: (repo: UserRepositoryPort) => new AuthenticateService(repo),
    deps: [USER_REPOSITORY_PORT],
  },
  { provide: PAYMENT_PORT, useFactory: () => new PaymentService() },
  { provide: LOAN_INFO_PORT, useFactory: () => new LoanInfoService() },
  { provide: PROFILE_PORT, useFactory: () => new ProfileService() },
  { provide: ELIGIBILITY_PORT, useFactory: () => new EligibilityService() },

  // --- (c) CLL primary adapters: drive the core through the SAME driving ports ---
  {
    provide: INQUIRY_SERVICE,
    useFactory: (kb: KnowledgeBasePort) => new InquiryService(kb),
    deps: [KNOWLEDGE_BASE_PORT],
  },
  { provide: PERSONALIZATION_SERVICE, useFactory: () => new PersonalizationService() },
  {
    provide: CHAT_INSIGHTS_SERVICE,
    useFactory: (hist: ChatHistoryPort) => new ChatInsightsService(hist),
    deps: [CHAT_HISTORY_PORT],
  },
  {
    provide: ACCOUNT_SUMMARY_SERVICE,
    useFactory: (profile: ProfilePort, loan: LoanInfoPort, payment: PaymentPort) =>
      new AccountSummaryService(profile, loan, payment),
    deps: [PROFILE_PORT, LOAN_INFO_PORT, PAYMENT_PORT],
  },
];
