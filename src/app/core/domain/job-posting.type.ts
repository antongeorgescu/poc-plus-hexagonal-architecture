/**
 * CORE · DOMAIN — Shared kernel: a job posting from the knowledge base.
 * PURE TypeScript, ZERO @angular.
 *
 * WHY IT LIVES IN THE KERNEL rather than with KnowledgeBasePort. This is the
 * only shape in the app that crosses the WHOLE hexagon unchanged: produced by a
 * driven adapter, passed straight through `InquiryPort.getJobsForProgram`, and
 * rendered by a driving adapter. Declaring it on the driven port would force a
 * UI component to import from `ports/driven/` — an edge that exists nowhere else
 * in this codebase. Every other driven DTO (ChatHistoryRecord, WelcomeCopy) is
 * transformed by the core before it reaches the UI, so it has no such problem.
 *
 * It is grounding data, never a system of record and never a decision.
 */
export interface JobPosting {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string; // Full-time / Contract / Part-time
}
