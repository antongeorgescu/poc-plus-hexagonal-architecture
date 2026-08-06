/**
 * CONFIGURATION — Composition root (the ports-and-adapters wiring).
 * This is the ONE place that knows every concrete class. It:
 *   (a) binds DRIVEN adapters to driven-port tokens,
 *   (b) constructs the DETERMINISTIC region's services (injecting driven ports)
 *       and binds them to their driving-port tokens,
 *   (c) constructs the COGNITIVE region's services and binds them to THEIR
 *       driving-port tokens — note they receive driving ports of the deterministic
 *       region, i.e. they knock on the same doors the UI does.
 *
 * Swapping an adapter (a real DB, a real LLM behind LanguageModelPort) is a change
 * here only. SEAM: adapters depend on ports; both core regions depend on driven
 * ports. "The CLL proposes, the BLL disposes."
 */
import { Provider } from '@angular/core';

// Driven (secondary) adapters
import { CsvUserRepository } from '../adapters/driven/csv-user.repository';
import { InMemoryKnowledgeBase } from '../adapters/driven/in-memory-knowledge-base';
import { InMemoryChatHistory } from '../adapters/driven/in-memory-chat-history';
import { MockLanguageModel } from '../adapters/driven/mock-language-model';
import { AzureAiLanguageModel } from '../adapters/driven/azure-ai-language-model';
import { resolveAiConfig, toAzureOptions, usesAzure } from './ai.config';

// Core · deterministic region (implement the BLL driving ports)
import { AuthenticateService } from '../core/application/authenticate.service';
import { PaymentService } from '../core/application/payment.service';
import { LoanInfoService } from '../core/application/loan-info.service';
import { ProfileService } from '../core/application/profile.service';
import { EligibilityService } from '../core/application/eligibility.service';

// Core · cognitive region (implement the CLL driving ports)
import { InquiryService } from '../core/cognitive/inquiry.service';
import { PersonalizationService } from '../core/cognitive/personalization.service';
import { ChatInsightsService } from '../core/cognitive/chat-insights.service';
import { AccountSummaryService } from '../core/cognitive/account-summary.service';

// Port interfaces (for typing the factory dependencies)
import { UserRepositoryPort } from '../ports/driven/user-repository.port';
import { KnowledgeBasePort } from '../ports/driven/knowledge-base.port';
import { ChatHistoryPort } from '../ports/driven/chat-history.port';
import { LanguageModelPort } from '../ports/driven/language-model.port';
import { ProfilePort } from '../ports/driving/profile.port';
import { LoanInfoPort } from '../ports/driving/loan-info.port';
import { PaymentPort } from '../ports/driving/payment.port';

import {
  AUTHENTICATE_PORT,
  PAYMENT_PORT,
  LOAN_INFO_PORT,
  PROFILE_PORT,
  ELIGIBILITY_PORT,
  INQUIRY_PORT,
  PERSONALIZATION_PORT,
  CHAT_INSIGHTS_PORT,
  ACCOUNT_SUMMARY_PORT,
  USER_REPOSITORY_PORT,
  KNOWLEDGE_BASE_PORT,
  CHAT_HISTORY_PORT,
  LANGUAGE_MODEL_PORT,
} from './tokens';

export const hexagonalProviders: Provider[] = [
  // --- (a) DRIVEN adapters bound to their driven-port tokens (core drives OUT) ---
  { provide: USER_REPOSITORY_PORT, useFactory: () => new CsvUserRepository() },
  { provide: KNOWLEDGE_BASE_PORT, useFactory: () => new InMemoryKnowledgeBase() },
  { provide: CHAT_HISTORY_PORT, useFactory: () => new InMemoryChatHistory() },
  // The LLM runtime is a technology behind a port. THIS factory is the only
  // place in the app that knows whether the words come from an in-process stub
  // or from Azure OpenAI — no core file, no UI file, and no other adapter can
  // tell. The mock is always constructed: in Azure mode it becomes the offline
  // fallback, so a missing key or a dead endpoint degrades instead of breaking.
  {
    provide: LANGUAGE_MODEL_PORT,
    useFactory: (): LanguageModelPort => {
      const cfg = resolveAiConfig();
      const offline = new MockLanguageModel();
      if (!usesAzure(cfg)) return offline;
      console.info(
        `[providers] LanguageModelPort -> Azure OpenAI (mode=${cfg.mode}, ` +
          `deployment=${cfg.deployment}); falling back to the stub on any failure.`
      );
      return new AzureAiLanguageModel(toAzureOptions(cfg), offline);
    },
  },

  // --- (b) Deterministic region bound to its DRIVING-port tokens (the way IN) ---
  {
    provide: AUTHENTICATE_PORT,
    useFactory: (repo: UserRepositoryPort) => new AuthenticateService(repo),
    deps: [USER_REPOSITORY_PORT],
  },
  { provide: PAYMENT_PORT, useFactory: () => new PaymentService() },
  { provide: LOAN_INFO_PORT, useFactory: () => new LoanInfoService() },
  { provide: PROFILE_PORT, useFactory: () => new ProfileService() },
  { provide: ELIGIBILITY_PORT, useFactory: () => new EligibilityService() },

  // --- (c) Cognitive region bound to its OWN driving-port tokens.
  //         It reaches the deterministic region only through driving ports, and
  //         the model runtime only through LanguageModelPort. ---
  {
    provide: INQUIRY_PORT,
    useFactory: (model: LanguageModelPort, kb: KnowledgeBasePort) =>
      new InquiryService(model, kb),
    deps: [LANGUAGE_MODEL_PORT, KNOWLEDGE_BASE_PORT],
  },
  {
    provide: PERSONALIZATION_PORT,
    useFactory: (model: LanguageModelPort) => new PersonalizationService(model),
    deps: [LANGUAGE_MODEL_PORT],
  },
  {
    provide: CHAT_INSIGHTS_PORT,
    useFactory: (hist: ChatHistoryPort, model: LanguageModelPort) =>
      new ChatInsightsService(hist, model),
    deps: [CHAT_HISTORY_PORT, LANGUAGE_MODEL_PORT],
  },
  {
    provide: ACCOUNT_SUMMARY_PORT,
    useFactory: (
      profile: ProfilePort,
      loan: LoanInfoPort,
      payment: PaymentPort,
      model: LanguageModelPort
    ) => new AccountSummaryService(profile, loan, payment, model),
    deps: [PROFILE_PORT, LOAN_INFO_PORT, PAYMENT_PORT, LANGUAGE_MODEL_PORT],
  },
];
