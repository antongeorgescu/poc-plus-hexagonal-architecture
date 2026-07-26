/**
 * ADAPTERS · DRIVEN (secondary) — In-memory chat history.
 * IMPLEMENTS ChatHistoryPort. Returns RAW synthetic conversation facts (counts,
 * recap text, a raw tone score). It does NOT interpret them — the CLL's
 * ChatInsightsService turns the raw toneScore into a sentiment reading.
 *
 * By design (synthetic, no AI call):
 *   - Type 1 (excellent):     positive tone, long/engaged recap
 *   - Type 2 (delinquency g1): negative tone, short recap
 *   - Type 3 (delinquency g2): more negative tone, very short or none
 */
import { ChatHistoryPort, ChatHistoryRecord } from '../../ports/driven/chat-history.port';
import { User } from '../../core/domain/user.entity';

export class InMemoryChatHistory implements ChatHistoryPort {
  getHistory(user: User): ChatHistoryRecord {
    switch (user.userType) {
      case 1:
        return this.forEngaged(user);
      case 2:
        return this.forDelinquentG1(user);
      default:
        return this.forDelinquentG2(user);
    }
  }

  private forEngaged(user: User): ChatHistoryRecord {
    const toneScore = Math.min(96, 86 + Math.round(user.onTimeStreak / 12));
    const sessions = 6;
    const bot = 40 + (user.onTimeStreak % 9);
    return {
      liveChatSessions: sessions,
      chatbotMessages: bot,
      lastContact: '3 days ago',
      toneScore,
      summary:
        `Over the past several weeks you've been a highly engaged partner in ` +
        `managing your loan. Across ${sessions} live-chat sessions and ${bot} ` +
        `chatbot messages you set up autopay, compared refinancing options to ` +
        `secure a lower rate, and checked in as you crossed the halfway mark on ` +
        `your balance. Your questions were forward-looking — extra-payment ` +
        `strategies, loyalty rewards, and payoff timelines — and the tone stayed ` +
        `consistently upbeat and collaborative, often thanking the team for quick, ` +
        `clear answers.`,
    };
  }

  private forDelinquentG1(user: User): ChatHistoryRecord {
    const toneScore = Math.max(28, 42 - user.paymentsMissed * 2);
    return {
      liveChatSessions: 2,
      chatbotMessages: 9 + user.paymentsMissed,
      lastContact: '2 weeks ago',
      toneScore,
      summary:
        `In your recent chats you raised concerns about a missed payment and ` +
        `asked how to avoid late fees. The conversations were brief and a little ` +
        `tense, but you were looking for a workable path forward.`,
    };
  }

  private forDelinquentG2(user: User): ChatHistoryRecord {
    const toneScore = Math.max(8, 20 - user.paymentsMissed);
    // Heaviest delinquency has effectively no usable conversation history.
    const noHistory = user.paymentsMissed >= 9;
    return {
      liveChatSessions: noHistory ? 0 : 1,
      chatbotMessages: noHistory ? 2 : 4,
      lastContact: noHistory ? 'over 6 weeks ago' : '6 weeks ago',
      toneScore,
      summary: noHistory
        ? null
        : `Your last chat was short and frustrated — mostly about the past-due balance.`,
    };
  }
}
