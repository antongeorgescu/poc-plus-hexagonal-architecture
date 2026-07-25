/**
 * Inquiry categories the (mock) classifier can resolve a free-text
 * question into.
 *
 * NEXT_PAYMENT and LOAN_BALANCE are "deterministic": the answer is the
 * same set of components for every user type. HARDSHIP and LIFE_EVENT are
 * "personalized": the components shown depend on the user type.
 */
export type InquiryCategory =
  | 'NEXT_PAYMENT'
  | 'LOAN_BALANCE'
  | 'EXTRA_PAYMENT'
  | 'PROFILE_UPDATE'
  | 'HARDSHIP'
  | 'LIFE_EVENT'
  | 'GENERAL';

export interface InquiryResult {
  category: InquiryCategory;
  /** True when the response components are identical for every user type. */
  deterministic: boolean;
  /** Short human-readable label, e.g. for headers/breadcrumbs. */
  label: string;
}

/** A single job posting shown for a HARDSHIP inquiry. */
export interface JobPosting {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string; // Full-time / Contract / Part-time
}
