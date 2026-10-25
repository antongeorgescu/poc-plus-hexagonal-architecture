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
import { ApiUserRepository } from '../adapters/driven/api-user.repository';
import { ApiPaymentRepository } from '../adapters/driven/api-payment.repository';
import { ApiProfileRepository } from '../adapters/driven/api-profile.repository';
import { ApiKnowledgeBase } from '../adapters/driven/api-knowledge-base';
import { ApiChatHistory } from '../adapters/driven/api-chat-history';
import { ApiLanguageModel } from '../adapters/driven/api-language-model';
import { AzureAiLanguageModel } from '../adapters/driven/azure-ai-language-model';
import { resolveAiConfig, toAzureOptions, usesAzure } from './ai.config';
import { INQUIRY_POLICY } from './inquiry.policy.config';

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
import { PaymentRepositoryPort } from '../ports/driven/payment-repository.port';
import { ProfileRepositoryPort } from '../ports/driven/profile-repository.port';
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
  PAYMENT_REPOSITORY_PORT,
  PROFILE_REPOSITORY_PORT,
  KNOWLEDGE_BASE_PORT,
  CHAT_HISTORY_PORT,
  LANGUAGE_MODEL_PORT,
  INQUIRY_POLICY_CONFIG,
} from './tokens';

export const hexagonalProviders: Provider[] = [
  // --- (0) BUSINESS SETTINGS bound as values (not ports) ---
  // One binding, two consumers: InquiryService applies it, and the read-only
  // /configuration screen displays it. Retune here and both follow.
  { provide: INQUIRY_POLICY_CONFIG, useValue: INQUIRY_POLICY },

  // --- (a) DRIVEN adapters bound to their driven-port tokens (core drives OUT) ---
  { provide: USER_REPOSITORY_PORT, useFactory: () => new ApiUserRepository() },
  { provide: PAYMENT_REPOSITORY_PORT, useFactory: () => new ApiPaymentRepository() },
  { provide: PROFILE_REPOSITORY_PORT, useFactory: () => new ApiProfileRepository() },
  { provide: KNOWLEDGE_BASE_PORT, useFactory: () => new ApiKnowledgeBase() },
  { provide: CHAT_HISTORY_PORT, useFactory: () => new ApiChatHistory() },
  // The language model is a technology behind a port. THIS factory is the only
  // place in the app that knows whether the words come from the server-side keyword
  // router (no LLM — the default) or from Azure OpenAI — no core file, no UI file, and
  // no other adapter can tell. The server-backed model is always constructed: in Azure
  // mode it becomes the offline fallback, so a missing key or a dead endpoint degrades
  // instead of breaking.
  {
    provide: LANGUAGE_MODEL_PORT,
    useFactory: (): LanguageModelPort => {
      const cfg = resolveAiConfig();
      const offline = new ApiLanguageModel();
      if (!usesAzure(cfg)) return offline;
      console.info(
        `[providers] LanguageModelPort -> Azure OpenAI (mode=${cfg.mode}, ` +
          `deployment=${cfg.deployment}); falling back to the server keyword model on any failure.`
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
  {
    provide: PAYMENT_PORT,
    useFactory: (repo: PaymentRepositoryPort) => new PaymentService(repo),
    deps: [PAYMENT_REPOSITORY_PORT],
  },
  { provide: LOAN_INFO_PORT, useFactory: () => new LoanInfoService() },
  {
    provide: PROFILE_PORT,
    useFactory: (repo: ProfileRepositoryPort) => new ProfileService(repo),
    deps: [PROFILE_REPOSITORY_PORT],
  },
  { provide: ELIGIBILITY_PORT, useFactory: () => new EligibilityService() },

  // --- (c) Cognitive region bound to its OWN driving-port tokens.
  //         It reaches the deterministic region only through driving ports, and
  //         the model runtime only through LanguageModelPort. ---
  {
    provide: INQUIRY_PORT,
    // The determinism map, topic labels and topic descriptions are BUSINESS
    // settings, bound here like every other binding. The core applies them; it
    // does not own their values.
    useFactory: (model: LanguageModelPort, kb: KnowledgeBasePort) =>
      new InquiryService(model, kb, INQUIRY_POLICY),
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
