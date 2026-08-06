/**
 * ADAPTERS · DRIVEN — AzureAiLanguageModel: implements LanguageModelPort against
 * Azure OpenAI (Chat Completions).
 *
 * This is the REAL model runtime, and it is a secondary adapter like any other:
 * it sits on the outer ring, the core never imports it, and the composition root
 * is the only file that knows it exists. Swapping it for the mock is one line in
 * providers.ts — that claim is now actually true, because the port is async.
 *
 * WHAT THIS ADAPTER MAY NOT DO — the CLL/BLL split survives the upgrade:
 *   · It never computes an authoritative value. Every figure in a prompt below
 *     arrives already computed from the deterministic region, and the system
 *     prompts forbid the model from altering, recomputing or inventing numbers.
 *   · It never decides a category's meaning. classifyInquiry PROPOSES one of a
 *     fixed set of labels, or null; InquiryService applies the determinism
 *     policy. An unparseable or unknown answer degrades to null ("no opinion"),
 *     which the cognitive region already handles as GENERAL.
 *   · It never fails the user. Any transport error, timeout, bad status or
 *     unusable payload delegates to the injected fallback (the mock), so the POC
 *     runs identically with no credentials, no network, or a cold Azure resource.
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

/**
 * Everything this adapter needs to reach Azure. Declared HERE, not in
 * `configuration/`, so the dependency points the right way: the composition root
 * knows about the adapter, the adapter knows nothing about the composition root.
 * Note there is no "mode" here — modes are a deployment concept; this class only
 * needs to know whether IT should attach the credential.
 */
export interface AzureAiOptions {
  /** Prefixed to `/openai/deployments/...`; a relative path when proxied. */
  baseUrl: string;
  /** Azure OpenAI *deployment* name, not the base model name. */
  deployment: string;
  apiVersion: string;
  /** Only used when `sendKeyHeader` is true. */
  apiKey: string;
  /** False when a proxy injects the credential — then the bundle holds no key. */
  sendKeyHeader: boolean;
  timeoutMs: number;
  temperature: number;
  maxTokens: number;
}

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

/** Shared guardrail prepended to every narration prompt. */
const NARRATION_RULES =
  'You write one short paragraph of plain, warm, second-person prose for a student-loan ' +
  'borrower. Absolute rules: use ONLY the figures given to you; never invent, recompute, ' +
  'round differently, or infer any number, date, rate or amount; never give financial, ' +
  'legal or eligibility advice; never promise an outcome. No markdown, no bullet points, ' +
  'no headings. Two to four sentences.';

export class AzureAiLanguageModel implements LanguageModelPort {
  constructor(
    private readonly config: AzureAiOptions,
    /** Offline stand-in used whenever a live call cannot be completed. */
    private readonly fallback: LanguageModelPort
  ) {}

  // ---------------------------------------------------------------- proposals

  /**
   * SEMANTIC matching. The candidate list and its descriptions arrive from the
   * core; this adapter holds no copy of the taxonomy and no hand-written
   * tiebreak rules. The model is asked to judge which description best fits the
   * borrower's wording — so adding a category, or sharpening what one means,
   * is an edit in the core and needs no change here.
   *
   * `temperature: 0` because this is a matching task, not a creative one: the
   * same wording against the same descriptions should yield the same label.
   */
  async classifyInquiry(
    text: string,
    candidates: readonly CategoryDescriptor[]
  ): Promise<InquiryCategory | null> {
    // No candidates means nothing to match against — abstain rather than guess.
    if (candidates.length === 0) return null;

    const catalogue = candidates
      .map((c) => `${c.category}: ${c.description}`)
      .join('\n');

    const system =
      'You match a student-loan borrower message to the ONE topic whose ' +
      'description fits it best. Judge by meaning, not by shared words — the ' +
      'borrower will phrase things in their own way, and may make typos.\n\n' +
      `TOPICS\n${catalogue}\n\n` +
      'Reply with the topic label alone — no punctuation, quotes or explanation. ' +
      'If no description is a good fit, reply exactly NONE. Prefer NONE over a ' +
      'weak match: a wrong topic shows the borrower the wrong screen.';

    const raw = await this.complete(
      [
        { role: 'system', content: system },
        { role: 'user', content: text },
      ],
      { maxTokens: 12, temperature: 0 }
    );

    if (raw === null) return this.fallback.classifyInquiry(text, candidates);

    const answer = raw.trim().toUpperCase().replace(/[^A-Z_]/g, '');
    if (answer === 'NONE' || answer === '') return null; // a real "no opinion"
    // Validate against what the CORE offered, never against a local list.
    const match = candidates.find((c) => c.category === answer);
    // An unrecognised label is model noise, not a proposal. Say nothing.
    return match?.category ?? null;
  }

  // --------------------------------------------------------------- narration

  async narrateLoan(profile: BorrowerProfile, loan: LoanInfo): Promise<string> {
    const facts = {
      programOfStudy: profile.programOfStudy,
      originalAmount: loan.originalAmount,
      currentBalance: loan.currentBalance,
      interestRatePercent: loan.interestRate,
      paidOffPercent: loan.paidPercent,
      monthsToMaturity: loan.monthsToMaturity,
      maturityDate: loan.maturityDate,
    };
    const text = await this.complete(
      [
        { role: 'system', content: NARRATION_RULES },
        {
          role: 'user',
          content:
            'Summarise this borrower’s loan using only these already-computed facts. ' +
            'Render money in USD and the maturity as a month and year.\n' +
            JSON.stringify(facts, null, 2),
        },
      ],
      {}
    );
    return text ?? this.fallback.narrateLoan(profile, loan);
  }

  async narratePayments(payment: PaymentSnapshot): Promise<string> {
    const text = await this.complete(
      [
        {
          role: 'system',
          content:
            NARRATION_RULES +
            ' If a past-due amount is present, state it plainly and without alarm; ' +
            'if the borrower has an on-time streak, acknowledge it.',
        },
        {
          role: 'user',
          content:
            'Summarise this borrower’s payment position using only these ' +
            'already-computed facts.\n' + JSON.stringify(payment, null, 2),
        },
      ],
      {}
    );
    return text ?? this.fallback.narratePayments(payment);
  }

  async describeTone(label: SentimentLabel): Promise<string> {
    const text = await this.complete(
      [
        {
          role: 'system',
          content:
            'You write a single supportive sentence for a student-loan borrower, ' +
            'reacting to the overall tone of their recent conversations. The tone ' +
            'band has ALREADY been decided — do not dispute, re-score or mention it ' +
            'numerically. Warm, brief, never patronising. No markdown.',
        },
        { role: 'user', content: `Tone band: ${label}` },
      ],
      { maxTokens: 80 }
    );
    return text ?? this.fallback.describeTone(label);
  }

  async composeWelcome(user: User): Promise<WelcomeCopy> {
    const raw = await this.complete(
      [
        {
          role: 'system',
          content:
            'You write the welcome panel of a student-loan self-service portal. ' +
            'Return ONLY a JSON object with keys: "greeting" (string, may include ' +
            'one emoji), "question" (string), "suggestions" (array of exactly 3 ' +
            'short first-person questions the borrower might ask). No markdown ' +
            'fence, no commentary. Never state or imply an amount, rate, date or ' +
            'eligibility outcome — you do not have those facts.',
        },
        {
          role: 'user',
          content:
            `Borrower first name: ${user.firstName}. Standing tier: ${user.userType} ` +
            '(1 = excellent standing, 2 = generally on track, 3 = struggling). ' +
            'Match the warmth and directness to the tier.',
        },
      ],
      { json: true, maxTokens: 300, temperature: 0.6 }
    );

    if (raw === null) return this.fallback.composeWelcome(user);

    const parsed = this.parseWelcome(raw);
    // Structurally wrong output is unusable copy, not a partial success.
    return parsed ?? this.fallback.composeWelcome(user);
  }

  private parseWelcome(raw: string): WelcomeCopy | null {
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '');
      const o = JSON.parse(cleaned) as Partial<WelcomeCopy>;
      const suggestions = Array.isArray(o.suggestions)
        ? o.suggestions.filter((s): s is string => typeof s === 'string' && s.trim() !== '')
        : [];
      if (typeof o.greeting !== 'string' || !o.greeting.trim()) return null;
      if (typeof o.question !== 'string' || !o.question.trim()) return null;
      if (suggestions.length < 1) return null;
      return {
        greeting: o.greeting.trim(),
        question: o.question.trim(),
        suggestions: suggestions.slice(0, 3),
      };
    } catch {
      return null;
    }
  }

  // ----------------------------------------------------------------- transport

  /**
   * One Chat Completions round trip. Returns the assistant text, or null when the
   * call could not be completed for ANY reason — the caller then falls back. This
   * method is the only place that knows Azure's wire format exists.
   */
  private async complete(
    messages: ChatMessage[],
    opts: { maxTokens?: number; temperature?: number; json?: boolean }
  ): Promise<string | null> {
    const { baseUrl, deployment, apiVersion, apiKey, sendKeyHeader, timeoutMs } = this.config;
    const url =
      `${baseUrl.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(deployment)}` +
      `/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // When proxied, the dev server attaches the credential; the bundle has none.
    if (sendKeyHeader && apiKey) headers['api-key'] = apiKey;

    const body: Record<string, unknown> = {
      messages,
      temperature: opts.temperature ?? this.config.temperature,
      max_tokens: opts.maxTokens ?? this.config.maxTokens,
    };
    if (opts.json) body['response_format'] = { type: 'json_object' };

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abort.signal,
      });

      if (!res.ok) {
        console.warn(`[azure-ai] ${res.status} ${res.statusText} — using offline fallback.`);
        return null;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim() === '') {
        // Also covers a content-filter block, which returns no usable text.
        console.warn('[azure-ai] empty completion — using offline fallback.');
        return null;
      }
      return content;
    } catch (err) {
      const reason = abort.signal.aborted ? `timed out after ${timeoutMs}ms` : String(err);
      console.warn(`[azure-ai] call failed (${reason}) — using offline fallback.`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
