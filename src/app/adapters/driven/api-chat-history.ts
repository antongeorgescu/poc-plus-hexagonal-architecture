/**
 * ADAPTERS · DRIVEN (secondary) — API chat history.
 * IMPLEMENTS ChatHistoryPort. Returns RAW conversation facts (counts, recap text, a
 * raw tone score) from the chat_history table behind the local API
 * (GET /api/chat-history) — one row per borrower. It does NOT interpret them: the
 * CLL's ChatInsightsService turns the raw toneScore into a sentiment reading.
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

export class ApiChatHistory implements ChatHistoryPort {
  private readonly cache = new Map<string, Promise<ChatHistoryRecord>>();

  getHistory(user: User): Promise<ChatHistoryRecord> {
    // One request per borrower, then replayed to all callers.
    const key = user.username.toLowerCase();
    let record = this.cache.get(key);
    if (!record) {
      record = fetch(`/api/chat-history?username=${encodeURIComponent(user.username)}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load chat history (${res.status})`);
          return res.json() as Promise<{ record: ChatHistoryRecord | null }>;
        })
        .then((body) => body.record ?? NO_HISTORY);
      this.cache.set(key, record);
    }
    return record;
  }
}
