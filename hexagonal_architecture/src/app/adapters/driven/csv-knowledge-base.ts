/**
 * ADAPTERS · DRIVEN (secondary) — CSV knowledge base.
 * IMPLEMENTS the KnowledgeBasePort. Grounding source only (a synthetic job
 * catalog); it computes no money and decides no eligibility.
 *
 * The postings live in assets/jobs.csv — each row carries its OWN location and
 * pay, so the catalog is data, not code. The borrower's location is used only to
 * order the results (nearest first), never to invent a posting.
 */
import { KnowledgeBasePort } from '../../ports/driven/knowledge-base.port';
import { JobPosting } from '../../core/domain/job-posting.type';

/** One row of assets/jobs.csv: a JobPosting plus the columns used for matching. */
interface JobRow extends JobPosting {
  program: string;
  city: string;
  province: string;
}

/** Program value used for postings open to any field of study. */
const GENERAL_PROGRAM = 'General';

export class CsvKnowledgeBase implements KnowledgeBasePort {
  private cache: Promise<JobRow[]> | null = null;

  async getJobsForProgram(program: string, location: string): Promise<JobPosting[]> {
    const rows = await this.load();
    const wanted = program.trim().toLowerCase();
    const matches = rows.filter((r) => r.program.toLowerCase() === wanted);
    const listings =
      matches.length > 0 ? matches : rows.filter((r) => r.program === GENERAL_PROGRAM);
    return nearestFirst(listings, location);
  }

  private load(): Promise<JobRow[]> {
    // Loaded once, then replayed to all callers.
    if (!this.cache) {
      this.cache = fetch('assets/jobs.csv')
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load jobs.csv (${res.status})`);
          return res.text();
        })
        .then((csv) => parseJobsCsv(csv));
    }
    return this.cache;
  }
}

/**
 * Orders postings by proximity to the borrower: same city first, then same
 * province, then the rest. Array.prototype.sort is stable, so the CSV order is
 * preserved within each band.
 */
function nearestFirst(rows: JobRow[], location: string): JobPosting[] {
  const [city = '', province = ''] = location.split(',').map((part) => part.trim());
  const rank = (r: JobRow) =>
    r.city === city && r.province === province ? 0 : r.province === province ? 1 : 2;

  return [...rows]
    .sort((a, b) => rank(a) - rank(b))
    .map(({ title, company, location, salary, type }) => ({
      title,
      company,
      location,
      salary,
      type,
    }));
}

/**
 * Minimal CSV parser. The data set intentionally avoids embedded commas and
 * quotes so a straightforward split is sufficient for this POC — which is why
 * pay is stored as an amount + unit and formatted here.
 */
function parseJobsCsv(csv: string): JobRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const record: Record<string, string> = {};
    headers.forEach((h, i) => (record[h] = cells[i] ?? ''));

    const city = record['city'];
    const province = record['province'];

    return {
      program: record['program'],
      title: record['title'],
      company: record['company'],
      city,
      province,
      location: `${city}, ${province}`,
      salary: formatSalary(Number(record['salaryAmount']), record['salaryUnit']),
      type: record['type'],
    } satisfies JobRow;
  });
}

/** "82000" + "yr" -> "C$82,000 / yr"; "28" + "hr" -> "C$28 / hr". */
function formatSalary(amount: number, unit: string): string {
  return unit === 'hr'
    ? `C$${amount} / hr`
    : `C$${amount.toLocaleString('en-CA')} / yr`;
}
