/**
 * PORTS · DRIVEN (outbound / secondary) — KnowledgeBasePort.
 * PURE TypeScript, ZERO @angular. A read-only grounding source the core (and the
 * CLL's grounding reads) reach through this interface. Never a system of record
 * and never a place where money is computed.
 */
import { JobPosting } from '../../core/domain/job-posting.type';

export interface KnowledgeBasePort {
  /**
   * Mock job board keyed by the borrower's program of study. `location` only
   * ranks the matches (nearest first) — each posting carries its own location.
   * Async because the catalog is a stored data set, not a hard-coded literal.
   */
  getJobsForProgram(program: string, location: string): Promise<JobPosting[]>;
}
