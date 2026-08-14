/**
 * CORE · COGNITIVE — The inquiry policy CONTRACT.
 * PURE TypeScript, ZERO @angular.
 *
 * The core declares the *shape* of the policy it requires; the composition root
 * supplies the values (`configuration/inquiry.policy.config.ts`). This is the
 * same rule the ports follow — the core names an interface, never a concrete
 * source — applied to configuration rather than to behaviour.
 *
 * WHY THE VALUES LIVE OUTSIDE. Which topics are answered identically for every
 * borrower is a business setting a servicer may tune per deployment, so it is
 * bound once at the composition root alongside every other binding.
 *
 * WHAT HAS NOT CHANGED. The policy is still applied *inside* the core, and it is
 * still not the model's to set. `LanguageModelPort` proposes a category; this
 * layer stamps the flag. Moving the values to the composition root changes who
 * configures the taxonomy, never who decides an individual classification.
 */
import { InquiryCategory } from '../domain/inquiry.type';

export interface InquiryPolicy {
  /**
   * FIXED determinism policy — owned by the business, not the AI. States which
   * categories are answered with the SAME components for every borrower.
   */
  readonly determinism: Record<InquiryCategory, boolean>;

  /** Business-owned topic labels (headers/breadcrumbs) — not model output. */
  readonly labels: Record<InquiryCategory, string>;

  /**
   * Business-owned MEANING of each topic — the signal a semantic classifier
   * matches the borrower's wording against, kept out of any adapter's prompt.
   */
  readonly descriptions: Record<InquiryCategory, string>;
}
