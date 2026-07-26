/**
 * APPLICATION — Outbound port for the (read-only) knowledge base used for
 * grounding. PURE TypeScript, ZERO @angular. It is a grounding source only,
 * never a system of record and never a place where money is computed.
 */
import { JobPosting } from '../../domain/inquiry';

export interface KnowledgeBasePort {
  /** Mock job board keyed by the borrower's program of study + location. */
  getJobsForProgram(program: string, location: string): JobPosting[];
}
