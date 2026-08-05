/**
 * CORE · COGNITIVE — Conversation insights. It INTERPRETS; it does not decide.
 * PURE TypeScript, ZERO @angular.
 *
 * Grounding (raw conversation facts) arrives through the driven ChatHistoryPort;
 * the supportive copy comes from the driven LanguageModelPort. What lives here is
 * the POLICY in between: the score bands that turn a raw tone signal into a
 * label, an emoji and a severity tone. Purely cognitive/presentational — it
 * computes no balance, payment, or eligibility.
 */
import { ChatInsights, ChatInsightsPort, ChatSentiment } from '../../ports/driving/chat-insights.port';
import { ChatHistoryPort } from '../../ports/driven/chat-history.port';
import { LanguageModelPort } from '../../ports/driven/language-model.port';
import { SentimentLabel, SentimentTone } from '../domain/sentiment.vocabulary';
import { User } from '../domain/user.entity';

/** Business-owned bands, highest first. Not the model's call. */
const SENTIMENT_BANDS: {
  min: number;
  label: SentimentLabel;
  emoji: string;
  tone: SentimentTone;
}[] = [
  { min: 80, label: 'Very positive', emoji: '😄', tone: 'good' },
  { min: 60, label: 'Positive', emoji: '🙂', tone: 'good' },
  { min: 45, label: 'Neutral', emoji: '😐', tone: 'warn' },
  { min: 25, label: 'Negative', emoji: '😕', tone: 'warn' },
  { min: -Infinity, label: 'Very negative', emoji: '😟', tone: 'bad' },
];

export class ChatInsightsService implements ChatInsightsPort {
  constructor(
    private readonly history: ChatHistoryPort,
    private readonly languageModel: LanguageModelPort
  ) {}

  async getInsights(user: User): Promise<ChatInsights> {
    // Grounding: raw facts come from the driven port; this layer only interprets.
    const record = this.history.getHistory(user);
    return {
      summary: record.summary,
      sentiment: await this.toSentiment(record.toneScore),
      liveChatSessions: record.liveChatSessions,
      chatbotMessages: record.chatbotMessages,
      lastContact: record.lastContact,
    };
  }

  /**
   * Maps a 0..100 score to a band, then asks the model to phrase it. The BAND is
   * chosen here from the raw score before the model is consulted — the model
   * only ever writes copy for a label the business already picked.
   */
  private async toSentiment(score: number): Promise<ChatSentiment> {
    const band = SENTIMENT_BANDS.find((b) => score >= b.min) ?? SENTIMENT_BANDS[SENTIMENT_BANDS.length - 1];

    return {
      score,
      label: band.label,
      emoji: band.emoji,
      tone: band.tone,
      blurb: await this.languageModel.describeTone(band.label),
    };
  }
}
