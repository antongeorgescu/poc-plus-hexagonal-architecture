/**
 * ADAPTERS · DRIVEN (secondary) — API knowledge base.
 * IMPLEMENTS the KnowledgeBasePort. Grounding source only (a synthetic job
 * catalog); it computes no money and decides no eligibility.
 *
 * The postings live in the job_posting table behind the local API (GET /api/jobs) —
 * each row carries its OWN location and pay, so the catalog is data, not code. The
 * API picks the postings for the program (or the open-to-anyone set). The borrower's
 * location is used only to order the results (nearest first), never to invent one.
 */
import { KnowledgeBasePort } from '../../ports/driven/knowledge-base.port';
import { JobPosting } from '../../core/domain/job-posting.type';

/** One row from GET /api/jobs: pay is an amount + a unit, the location is two columns. */
interface JobRow {
  title: string;
  company: string;
  city: string;
  province: string;
  salaryAmount: number;
  salaryUnit: string;
  type: string;
}

export class ApiKnowledgeBase implements KnowledgeBasePort {
  private readonly cache = new Map<string, Promise<JobRow[]>>();

  async getJobsForProgram(program: string, location: string): Promise<JobPosting[]> {
    return nearestFirst(await this.load(program.trim()), location);
  }

  private load(program: string): Promise<JobRow[]> {
    // One request per program, then replayed to all callers.
    const key = program.toLowerCase();
    let rows = this.cache.get(key);
    if (!rows) {
      rows = fetch(`/api/jobs?program=${encodeURIComponent(program)}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load job postings (${res.status})`);
          return res.json() as Promise<{ postings: JobRow[] }>;
        })
        .then((body) => body.postings);
      this.cache.set(key, rows);
    }
    return rows;
  }
}

/**
 * Orders postings by proximity to the borrower: same city first, then same
 * province, then the rest. Array.prototype.sort is stable, so the catalog order is
 * preserved within each band.
 */
function nearestFirst(rows: JobRow[], location: string): JobPosting[] {
  const [city = '', province = ''] = location.split(',').map((part) => part.trim());
  const rank = (r: JobRow) =>
    r.city === city && r.province === province ? 0 : r.province === province ? 1 : 2;

  return [...rows]
    .sort((a, b) => rank(a) - rank(b))
    .map((r) => ({
      title: r.title,
      company: r.company,
      location: `${r.city}, ${r.province}`,
      salary: formatSalary(r.salaryAmount, r.salaryUnit),
      type: r.type,
    }));
}

/** 82000 + "yr" -> "C$82,000 / yr"; 28 + "hr" -> "C$28 / hr". */
function formatSalary(amount: number, unit: string): string {
  return unit === 'hr'
    ? `C$${amount} / hr`
    : `C$${amount.toLocaleString('en-CA')} / yr`;
}
