/**
 * CONFIGURATION — Angular InjectionTokens for every port (the composition-root
 * ring). These tokens are typed to the PORT INTERFACES, not to concrete classes.
 *
 * Primary adapters (the UI) resolve DRIVING-port tokens — and cannot tell whether
 * the port behind one belongs to the deterministic region or the cognitive one.
 * Driven-port tokens are bound to secondary adapters (CSV, KB, chat history, the
 * model runtime). This file may import @angular (it is configuration, not core and
 * not ports).
 */
import { InjectionToken } from '@angular/core';

// Driving (inbound / primary) ports — deterministic region
import { AuthenticatePort } from '../ports/driving/authenticate.port';
import { PaymentPort } from '../ports/driving/payment.port';
import { LoanInfoPort } from '../ports/driving/loan-info.port';
import { ProfilePort } from '../ports/driving/profile.port';
import { EligibilityPort } from '../ports/driving/eligibility.port';

// Driving (inbound / primary) ports — cognitive region
import { InquiryPort } from '../ports/driving/inquiry.port';
import { PersonalizationPort } from '../ports/driving/personalization.port';
import { ChatInsightsPort } from '../ports/driving/chat-insights.port';
import { AccountSummaryPort } from '../ports/driving/account-summary.port';

// Driven (outbound / secondary) ports
import { UserRepositoryPort } from '../ports/driven/user-repository.port';
import { KnowledgeBasePort } from '../ports/driven/knowledge-base.port';
import { ChatHistoryPort } from '../ports/driven/chat-history.port';
import { LanguageModelPort } from '../ports/driven/language-model.port';

// --- Driving-port tokens · deterministic region (BLL) ---
export const AUTHENTICATE_PORT = new InjectionToken<AuthenticatePort>('AuthenticatePort');
export const PAYMENT_PORT = new InjectionToken<PaymentPort>('PaymentPort');
export const LOAN_INFO_PORT = new InjectionToken<LoanInfoPort>('LoanInfoPort');
export const PROFILE_PORT = new InjectionToken<ProfilePort>('ProfilePort');
export const ELIGIBILITY_PORT = new InjectionToken<EligibilityPort>('EligibilityPort');

// --- Driving-port tokens · cognitive region (CLL) — same edge, same kind of door ---
export const INQUIRY_PORT = new InjectionToken<InquiryPort>('InquiryPort');
export const PERSONALIZATION_PORT = new InjectionToken<PersonalizationPort>('PersonalizationPort');
export const CHAT_INSIGHTS_PORT = new InjectionToken<ChatInsightsPort>('ChatInsightsPort');
export const ACCOUNT_SUMMARY_PORT = new InjectionToken<AccountSummaryPort>('AccountSummaryPort');

// --- Driven-port tokens (the core reaches OUT through these) ---
export const USER_REPOSITORY_PORT = new InjectionToken<UserRepositoryPort>('UserRepositoryPort');
export const KNOWLEDGE_BASE_PORT = new InjectionToken<KnowledgeBasePort>('KnowledgeBasePort');
export const CHAT_HISTORY_PORT = new InjectionToken<ChatHistoryPort>('ChatHistoryPort');
export const LANGUAGE_MODEL_PORT = new InjectionToken<LanguageModelPort>('LanguageModelPort');
