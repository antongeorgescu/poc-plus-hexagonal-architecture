/**
 * PORTS · DRIVEN (outbound / secondary) — KnowledgeBasePort.
 * PURE TypeScript, ZERO @angular. A read-only grounding source the core (and the
 * CLL's grounding reads) reach through this interface. Never a system of record
 * and never a place where money is computed.
 */
import { JobPosting } from '../../core/domain/job-posting.type';

export interface KnowledgeBasePort {
  /** Mock job board keyed by the borrower's program of study + location. */
  getJobsForProgram(program: string, location: string): JobPosting[];
}
