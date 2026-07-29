/**
 * PORTS · DRIVING (inbound / primary) — InquiryPort.
 * PURE TypeScript, ZERO @angular.
 *
 * A COGNITIVE driving port: the interface a driver calls to have free text
 * classified into a topic. The returned `deterministic` flag comes from a FIXED
 * business policy inside the cognitive region — never from the model.
 */
import { InquiryResult, JobPosting } from '../../core/domain/inquiry';
import { User } from '../../core/domain/user.entity';

export interface InquiryPort {
  /** Classify free text into a topic + the fixed determinism policy for it. */
  classify(text: string): InquiryResult;
  /** Read-only grounding lookup (never a system of record, never a decision). */
  getJobsForProgram(user: User): JobPosting[];
}
