/**
 * ADAPTERS · DRIVEN (secondary) — CSV chat history.
 * IMPLEMENTS ChatHistoryPort. Returns RAW synthetic conversation facts (counts,
 * recap text, a raw tone score) read from assets/chat-summary.csv — one row per
 * borrower. It does NOT interpret them: the CLL's ChatInsightsService turns the
 * raw toneScore into a sentiment reading.
 *
 * The rows are authored to match each borrower's standing:
 *   - Type 1 (excellent):      positive tone, long/engaged recap
 *   - Type 2 (delinquency g1): negative tone, short recap
 *   - Type 3 (delinquency g2): more negative tone, very short or none
 */
import { ChatHistoryPort, ChatHistoryRecord } from '../../ports/driven/chat-history.port';
import { User } from '../../core/domain/user.entity';

/** Used when a borrower has no row at all — never a decision, just an empty read. */
const NO_HISTORY: ChatHistoryRecord = {
  liveChatSessions: 0,
  chatbotMessages: 0,
  lastContact: 'no recent contact',
  summary: null,
  toneScore: 50,
};

export class CsvChatHistory implements ChatHistoryPort {
  private cache: Promise<Map<string, ChatHistoryRecord>> | null = null;

  async getHistory(user: User): Promise<ChatHistoryRecord> {
    const byUsername = await this.load();
    return byUsername.get(user.username.toLowerCase()) ?? NO_HISTORY;
  }

  private load(): Promise<Map<string, ChatHistoryRecord>> {
    // Loaded once, then replayed to all callers.
    if (!this.cache) {
      this.cache = fetch('assets/chat-summary.csv')
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load chat-summary.csv (${res.status})`);
          return res.text();
        })
        .then((csv) => parseChatSummaryCsv(csv));
    }
    return this.cache;
  }
}

/**
 * Minimal CSV parser. Unlike the other assets, a recap is prose and DOES contain
 * commas — so `summary` is the last column, quoted, and everything from that
 * column onward is re-joined rather than split. An empty summary means "not
 * enough history to recap", which the port models as null.
 */
function parseChatSummaryCsv(csv: string): Map<string, ChatHistoryRecord> {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const byUsername = new Map<string, ChatHistoryRecord>();
  if (lines.length < 2) return byUsername;

  const headers = lines[0].split(',').map((h) => h.trim());
  const summaryAt = headers.indexOf('summary');

  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const record: Record<string, string> = {};
    headers.forEach((h, i) => (record[h] = (cells[i] ?? '').trim()));

    const summary = cells
      .slice(summaryAt)
      .join(',')
      .trim()
      .replace(/^"|"$/g, '');

    byUsername.set(record['username'].toLowerCase(), {
      liveChatSessions: Number(record['liveChatSessions']),
      chatbotMessages: Number(record['chatbotMessages']),
      lastContact: record['lastContact'],
      toneScore: Number(record['toneScore']),
      summary: summary.length > 0 ? summary : null,
    });
  }

  return byUsername;
}
