/**
 * APPLICATION — Outbound port for the borrower's Live Chat + Chatbot history.
 * PURE TypeScript, ZERO @angular. Read-only grounding source: it returns raw
 * conversation facts. The CLL's ChatInsightsService interprets them (summary +
 * sentiment) — the gateway itself decides nothing authoritative.
 */
import { User } from '../../domain/user.entity';

export interface ChatHistoryRecord {
  liveChatSessions: number;
  chatbotMessages: number;
  lastContact: string;
  /** Raw conversation recap, or null when there isn't enough history. */
  summary: string | null;
  /** Raw sentiment signal 0 (very negative) .. 100 (very positive). */
  toneScore: number;
}

export interface ChatHistoryPort {
  getHistory(user: User): ChatHistoryRecord;
}
