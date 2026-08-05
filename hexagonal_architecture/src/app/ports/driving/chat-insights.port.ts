/**
 * PORTS · DRIVING (inbound / primary) — ChatInsightsPort.
 * PURE TypeScript, ZERO @angular.
 *
 * A COGNITIVE driving port: the interface a driver calls for a conversation recap
 * plus a sentiment reading. The reading is a SIGNAL for the UI, never an input to
 * a deterministic decision.
 */
import { User } from '../../core/domain/user.entity';
import { SentimentLabel, SentimentTone } from '../../core/domain/sentiment.vocabulary';

export interface ChatSentiment {
  /** 0 (very negative) .. 100 (very positive) — raw grounding signal. */
  score: number;
  label: SentimentLabel;
  emoji: string;
  tone: SentimentTone;
  blurb: string;
}

export interface ChatInsights {
  summary: string | null;
  sentiment: ChatSentiment;
  liveChatSessions: number;
  chatbotMessages: number;
  lastContact: string;
}

export interface ChatInsightsPort {
  getInsights(user: User): Promise<ChatInsights>;
}
