/**
 * CORE · DOMAIN — Inquiry vocabulary (shared category enum + result shape).
 * PURE TypeScript, ZERO @angular.
 *
 * The `deterministic` flag on an InquiryResult is set from a FIXED business
 * policy (see core/cognitive/inquiry.service.ts), NOT decided by AI.
 */
export type InquiryCategory =
  | 'NEXT_PAYMENT'
  | 'LOAN_BALANCE'
  | 'EXTRA_PAYMENT'
  | 'PROFILE_UPDATE'
  | 'HARDSHIP'
  | 'LIFE_EVENT'
  | 'REPAYMENT_OPTIONS'
  | 'GENERAL';

export interface InquiryResult {
  category: InquiryCategory;
  /** True when the response components are identical for every user type. */
  deterministic: boolean;
  /** Short human-readable label, e.g. for headers/breadcrumbs. */
  label: string;
}

/**
 * A category offered to the model for semantic matching: the label to return
 * plus a business-owned description of what the topic MEANS.
 *
 * The description is the matching signal. It exists so the taxonomy's semantics
 * live in the core with the business, not inside a prompt string in an adapter —
 * add a category and its meaning travels with it automatically.
 */
export interface CategoryDescriptor {
  category: InquiryCategory;
  description: string;
}

/** A single job posting from the knowledge base (grounding source). */
export interface JobPosting {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string; // Full-time / Contract / Part-time
}
