/**
 * INFRASTRUCTURE — Framework wiring (outermost ring). Angular InjectionTokens
 * for every outbound port, use case, and CLL adapter. UI components inject
 * these tokens; they never reach for a concrete class. Infrastructure is the
 * only ring allowed to name the concrete adapters (see providers.ts).
 */
import { InjectionToken } from '@angular/core';

// Ports
import { UserRepositoryPort } from '../application/ports/user-repository.port';
import { KnowledgeBasePort } from '../application/ports/knowledge-base.port';
import { ChatHistoryPort } from '../application/ports/chat-history.port';

// Use cases
import { Authenticate } from '../application/use-cases/authenticate.usecase';
import { GetLoanInfo } from '../application/use-cases/get-loan-info.usecase';
import { GetPaymentSnapshot } from '../application/use-cases/get-payment-snapshot.usecase';
import { SubmitPayment } from '../application/use-cases/submit-payment.usecase';
import { GetBorrowerProfile } from '../application/use-cases/get-borrower-profile.usecase';
import { UpdateProfile } from '../application/use-cases/update-profile.usecase';
import { CheckRateReliefEligibility } from '../application/use-cases/check-rate-relief-eligibility.usecase';

// CLL adapters
import { InquiryService } from '../adapters/cll/inquiry.service';
import { PersonalizationService } from '../adapters/cll/personalization.service';
import { ChatInsightsService } from '../adapters/cll/chat-insights.service';
import { AccountSummaryService } from '../adapters/cll/account-summary.service';

// --- Port tokens ---
export const USER_REPOSITORY = new InjectionToken<UserRepositoryPort>('UserRepositoryPort');
export const KNOWLEDGE_BASE = new InjectionToken<KnowledgeBasePort>('KnowledgeBasePort');
export const CHAT_HISTORY = new InjectionToken<ChatHistoryPort>('ChatHistoryPort');

// --- Use-case tokens ---
export const AUTHENTICATE = new InjectionToken<Authenticate>('Authenticate');
export const GET_LOAN_INFO = new InjectionToken<GetLoanInfo>('GetLoanInfo');
export const GET_PAYMENT_SNAPSHOT = new InjectionToken<GetPaymentSnapshot>('GetPaymentSnapshot');
export const SUBMIT_PAYMENT = new InjectionToken<SubmitPayment>('SubmitPayment');
export const GET_BORROWER_PROFILE = new InjectionToken<GetBorrowerProfile>('GetBorrowerProfile');
export const UPDATE_PROFILE = new InjectionToken<UpdateProfile>('UpdateProfile');
export const CHECK_RATE_RELIEF = new InjectionToken<CheckRateReliefEligibility>('CheckRateReliefEligibility');

// --- CLL adapter tokens ---
export const INQUIRY_SERVICE = new InjectionToken<InquiryService>('InquiryService');
export const PERSONALIZATION_SERVICE = new InjectionToken<PersonalizationService>('PersonalizationService');
export const CHAT_INSIGHTS_SERVICE = new InjectionToken<ChatInsightsService>('ChatInsightsService');
export const ACCOUNT_SUMMARY_SERVICE = new InjectionToken<AccountSummaryService>('AccountSummaryService');
