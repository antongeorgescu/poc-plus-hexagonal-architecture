/**
 * PORTS · DRIVING (inbound / primary) — InquiryPort.
 * PURE TypeScript, ZERO @angular.
 *
 * A COGNITIVE driving port: the interface a driver calls to have free text
 * classified into a topic. The returned `deterministic` flag comes from a FIXED
 * business policy inside the cognitive region — never from the model.
 */
import { InquiryCategory } from '../../core/domain/inquiry.type';
import { JobPosting } from '../../core/domain/job-posting.type';

/**
 * What a classification yields. Declared HERE because this port is its only
 * producer — the same way ChatInsightsPort declares ChatInsights.
 *
 * `deterministic` is stamped from a FIXED business policy in
 * `core/cognitive/inquiry.service.ts`, never decided by the model.
 */
export interface InquiryResult {
  category: InquiryCategory;
  /** True when the response components are identical for every user type. */
  deterministic: boolean;
  /** Short human-readable label, e.g. for headers/breadcrumbs. */
  label: string;
}
import { User } from '../../core/domain/user.entity';

export interface InquiryPort {
  /** Classify free text into a topic + the fixed determinism policy for it. */
  classify(text: string): Promise<InquiryResult>;
  /** Read-only grounding lookup (never a system of record, never a decision). */
  getJobsForProgram(user: User): JobPosting[];
}
