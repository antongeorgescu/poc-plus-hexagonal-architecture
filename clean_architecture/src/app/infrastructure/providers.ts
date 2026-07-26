/**
 * INFRASTRUCTURE — Composition root. Factory providers that bind concrete
 * adapters to port tokens and construct use cases via useFactory. This is the
 * ONE place that knows every concrete class; swapping an adapter (e.g. a real
 * DB, or a real AI-backed CLL) is a change here only.
 *
 * Dependency Rule: arrows point inward. Adapters implement application ports;
 * use cases depend on ports/entities; the CLL depends on use-case instances.
 */
import { Provider } from '@angular/core';

// Concrete adapters
import { CsvUserRepository } from '../adapters/persistence/csv-user.repository';
import { InMemoryKnowledgeBase } from '../adapters/persistence/in-memory-knowledge-base';
import { InMemoryChatHistory } from '../adapters/persistence/in-memory-chat-history';
import { InquiryService } from '../adapters/cll/inquiry.service';
import { PersonalizationService } from '../adapters/cll/personalization.service';
import { ChatInsightsService } from '../adapters/cll/chat-insights.service';
import { AccountSummaryService } from '../adapters/cll/account-summary.service';

// Use cases
import { Authenticate } from '../application/use-cases/authenticate.usecase';
import { GetLoanInfo } from '../application/use-cases/get-loan-info.usecase';
import { GetPaymentSnapshot } from '../application/use-cases/get-payment-snapshot.usecase';
import { SubmitPayment } from '../application/use-cases/submit-payment.usecase';
import { GetBorrowerProfile } from '../application/use-cases/get-borrower-profile.usecase';
import { UpdateProfile } from '../application/use-cases/update-profile.usecase';
import { CheckRateReliefEligibility } from '../application/use-cases/check-rate-relief-eligibility.usecase';

import {
  USER_REPOSITORY,
  KNOWLEDGE_BASE,
  CHAT_HISTORY,
  AUTHENTICATE,
  GET_LOAN_INFO,
  GET_PAYMENT_SNAPSHOT,
  SUBMIT_PAYMENT,
  GET_BORROWER_PROFILE,
  UPDATE_PROFILE,
  CHECK_RATE_RELIEF,
  INQUIRY_SERVICE,
  PERSONALIZATION_SERVICE,
  CHAT_INSIGHTS_SERVICE,
  ACCOUNT_SUMMARY_SERVICE,
} from './tokens';

export const infrastructureProviders: Provider[] = [
  // --- Gateways / adapters bound to their ports (outer → inner) ---
  { provide: USER_REPOSITORY, useFactory: () => new CsvUserRepository() },
  { provide: KNOWLEDGE_BASE, useFactory: () => new InMemoryKnowledgeBase() },
  { provide: CHAT_HISTORY, useFactory: () => new InMemoryChatHistory() },

  // --- Use cases (constructed from ports where needed) ---
  {
    provide: AUTHENTICATE,
    useFactory: (repo: CsvUserRepository) => new Authenticate(repo),
    deps: [USER_REPOSITORY],
  },
  { provide: GET_LOAN_INFO, useFactory: () => new GetLoanInfo() },
  { provide: GET_PAYMENT_SNAPSHOT, useFactory: () => new GetPaymentSnapshot() },
  { provide: SUBMIT_PAYMENT, useFactory: () => new SubmitPayment() },
  { provide: GET_BORROWER_PROFILE, useFactory: () => new GetBorrowerProfile() },
  { provide: UPDATE_PROFILE, useFactory: () => new UpdateProfile() },
  { provide: CHECK_RATE_RELIEF, useFactory: () => new CheckRateReliefEligibility() },

  // --- CLL adapters: consume use-case ports, never compute authoritative values ---
  {
    provide: INQUIRY_SERVICE,
    useFactory: (kb: InMemoryKnowledgeBase) => new InquiryService(kb),
    deps: [KNOWLEDGE_BASE],
  },
  { provide: PERSONALIZATION_SERVICE, useFactory: () => new PersonalizationService() },
  {
    provide: CHAT_INSIGHTS_SERVICE,
    useFactory: (hist: InMemoryChatHistory) => new ChatInsightsService(hist),
    deps: [CHAT_HISTORY],
  },
  {
    provide: ACCOUNT_SUMMARY_SERVICE,
    useFactory: (
      profile: GetBorrowerProfile,
      loan: GetLoanInfo,
      payment: GetPaymentSnapshot
    ) => new AccountSummaryService(profile, loan, payment),
    deps: [GET_BORROWER_PROFILE, GET_LOAN_INFO, GET_PAYMENT_SNAPSHOT],
  },
];
