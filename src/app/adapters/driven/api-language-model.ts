/**
 * ADAPTERS · DRIVEN (secondary) — API language model.
 * IMPLEMENTS LanguageModelPort by calling the local API (server/api.mjs), where the
 * "model" now lives: a weighted keyword router that PROPOSES a topic, and string
 * templates that PHRASE figures the core already computed. No LLM is involved.
 *
 * It is also the offline FALLBACK that AzureAiLanguageModel delegates to when a live
 * call fails, so the POC keeps working with no credentials and no Azure.
 *
 * Contract kept from the port: every method returns words, an enum, or null — never a
 * number — and none throws. If the API cannot be reached the adapter ABSTAINS: it
 * proposes no topic (the core turns that into GENERAL) and returns neutral copy, so a
 * model outage never blocks a borrower from the authoritative figures.
 */
import {
  CategoryDescriptor,
  LanguageModelPort,
  WelcomeCopy,
} from '../../ports/driven/language-model.port';
import { InquiryCategory } from '../../core/domain/inquiry.type';
import { SentimentLabel } from '../../core/domain/sentiment.type';
import { User } from '../../core/domain/user.entity';
import { BorrowerProfile } from '../../core/domain/borrower.entity';
import { LoanInfo } from '../../core/domain/loan.entity';
import { PaymentSnapshot } from '../../core/domain/payment.entity';

const BASE = '/api/language-model';

export class ApiLanguageModel implements LanguageModelPort {
  async classifyInquiry(
    text: string,
    candidates: readonly CategoryDescriptor[]
  ): Promise<InquiryCategory | null> {
    // Only the topic names travel: the router matches keywords, not descriptions, but it
    // still honours which topics the core is willing to accept.
    const body = await this.post<{ category: InquiryCategory | null }>('classify', {
      text,
      candidates: candidates.map((c) => ({ category: c.category })),
    });
    return body?.category ?? null;
  }

  async narrateLoan(profile: BorrowerProfile, loan: LoanInfo): Promise<string> {
    const body = await this.post<{ text: string }>('narrate-loan', {
      profile: { programOfStudy: profile.programOfStudy },
      loan,
    });
    return body?.text ?? 'Your loan figures are shown above.';
  }

  async narratePayments(payment: PaymentSnapshot): Promise<string> {
    const body = await this.post<{ text: string }>('narrate-payments', { payment });
    return body?.text ?? 'Your payment figures are shown above.';
  }

  async describeTone(label: SentimentLabel): Promise<string> {
    const body = await this.post<{ text: string }>('describe-tone', { label });
    return body?.text ?? 'Thanks for staying in touch.';
  }

  async composeWelcome(user: User): Promise<WelcomeCopy> {
    // Only what the copy needs — not the borrower's contact details or loan.
    const body = await this.post<{ copy: WelcomeCopy }>('compose-welcome', {
      user: { firstName: user.firstName, userType: user.userType },
    });
    return (
      body?.copy ?? {
        greeting: `Welcome back, ${user.firstName}.`,
        question: 'How can we help you today?',
        suggestions: [],
      }
    );
  }

  /** POST and parse; null on any failure (the caller supplies neutral copy / abstains). */
  private async post<T>(operation: string, payload: unknown): Promise<T | null> {
    try {
      const res = await fetch(`${BASE}/${operation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }
}
