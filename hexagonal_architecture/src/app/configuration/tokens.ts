/**
 * CONFIGURATION — Angular InjectionTokens for every port (the composition-root
 * ring). These tokens are typed to the PORT INTERFACES, not to concrete classes.
 *
 * Primary adapters (UI, CLL) resolve DRIVING-port tokens; the composition root
 * binds application services to those same tokens. Driven-port tokens are bound
 * to secondary adapters. This file may import @angular (it is configuration, not
 * core and not ports).
 */
import { InjectionToken } from '@angular/core';

// Driving (inbound / primary) ports
import { AuthenticatePort } from '../ports/driving/authenticate.port';
import { PaymentPort } from '../ports/driving/payment.port';
import { LoanInfoPort } from '../ports/driving/loan-info.port';
import { ProfilePort } from '../ports/driving/profile.port';
import { EligibilityPort } from '../ports/driving/eligibility.port';

// Driven (outbound / secondary) ports
import { UserRepositoryPort } from '../ports/driven/user-repository.port';
import { KnowledgeBasePort } from '../ports/driven/knowledge-base.port';
import { ChatHistoryPort } from '../ports/driven/chat-history.port';

// CLL primary adapters (peers of the UI — also drive the core)
import { InquiryService } from '../adapters/driving/cll/inquiry.service';
import { PersonalizationService } from '../adapters/driving/cll/personalization.service';
import { ChatInsightsService } from '../adapters/driving/cll/chat-insights.service';
import { AccountSummaryService } from '../adapters/driving/cll/account-summary.service';

// --- Driving-port tokens (the only way IN — primary adapters depend on these) ---
export const AUTHENTICATE_PORT = new InjectionToken<AuthenticatePort>('AuthenticatePort');
export const PAYMENT_PORT = new InjectionToken<PaymentPort>('PaymentPort');
export const LOAN_INFO_PORT = new InjectionToken<LoanInfoPort>('LoanInfoPort');
export const PROFILE_PORT = new InjectionToken<ProfilePort>('ProfilePort');
export const ELIGIBILITY_PORT = new InjectionToken<EligibilityPort>('EligibilityPort');

// --- Driven-port tokens (the core reaches OUT through these) ---
export const USER_REPOSITORY_PORT = new InjectionToken<UserRepositoryPort>('UserRepositoryPort');
export const KNOWLEDGE_BASE_PORT = new InjectionToken<KnowledgeBasePort>('KnowledgeBasePort');
export const CHAT_HISTORY_PORT = new InjectionToken<ChatHistoryPort>('ChatHistoryPort');

// --- CLL primary-adapter tokens ---
export const INQUIRY_SERVICE = new InjectionToken<InquiryService>('InquiryService');
export const PERSONALIZATION_SERVICE = new InjectionToken<PersonalizationService>('PersonalizationService');
export const CHAT_INSIGHTS_SERVICE = new InjectionToken<ChatInsightsService>('ChatInsightsService');
export const ACCOUNT_SUMMARY_SERVICE = new InjectionToken<AccountSummaryService>('AccountSummaryService');
