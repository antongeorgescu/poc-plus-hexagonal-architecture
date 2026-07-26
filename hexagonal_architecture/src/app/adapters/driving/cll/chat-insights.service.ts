/**
 * ADAPTERS · DRIVING · CLL — Conversation insights. A primary adapter whose
 * grounding is served through the driven ChatHistoryPort (raw facts). It
 * INTERPRETS the raw tone score into a friendly sentiment reading (label, emoji,
 * tone, blurb). Purely cognitive/presentational — it computes no balance,
 * payment, or eligibility. "The CLL proposes, the core disposes."
 */
import { ChatHistoryPort } from '../../../ports/driven/chat-history.port';
import { User } from '../../../core/domain/user.entity';

export type SentimentLabel =
  | 'Very positive'
  | 'Positive'
  | 'Neutral'
  | 'Negative'
  | 'Very negative';

export interface ChatSentiment {
  /** 0 (very negative) .. 100 (very positive). */
  score: number;
  label: SentimentLabel;
  emoji: string;
  tone: 'good' | 'warn' | 'bad';
  blurb: string;
}

export interface ChatInsights {
  summary: string | null;
  sentiment: ChatSentiment;
  liveChatSessions: number;
  chatbotMessages: number;
  lastContact: string;
}

export class ChatInsightsService {
  constructor(private readonly history: ChatHistoryPort) {}

  getInsights(user: User): ChatInsights {
    // Grounding: raw facts come from the driven port; the CLL only interprets.
    const record = this.history.getHistory(user);
    return {
      summary: record.summary,
      sentiment: this.toSentiment(record.toneScore),
      liveChatSessions: record.liveChatSessions,
      chatbotMessages: record.chatbotMessages,
      lastContact: record.lastContact,
    };
  }

  /** Maps a 0..100 score to a label, emoji, tone, and supportive blurb. */
  private toSentiment(score: number): ChatSentiment {
    let label: SentimentLabel;
    let emoji: string;
    let tone: ChatSentiment['tone'];
    let blurb: string;

    if (score >= 80) {
      label = 'Very positive';
      emoji = '😄';
      tone = 'good';
      blurb =
        "Your conversations have been positive and engaged — thank you for staying in touch!";
    } else if (score >= 60) {
      label = 'Positive';
      emoji = '🙂';
      tone = 'good';
      blurb = 'Your recent chats have had a friendly, constructive tone.';
    } else if (score >= 45) {
      label = 'Neutral';
      emoji = '😐';
      tone = 'warn';
      blurb = "Things have felt matter-of-fact lately — we're here whenever you need us.";
    } else if (score >= 25) {
      label = 'Negative';
      emoji = '😕';
      tone = 'warn';
      blurb =
        "We've noticed some frustration in recent chats. Let's find a plan that makes things easier.";
    } else {
      label = 'Very negative';
      emoji = '😟';
      tone = 'bad';
      blurb =
        "Recent conversations have felt stressful. You're not alone — a specialist can help you find relief today.";
    }

    return { score, label, emoji, tone, blurb };
  }
}
