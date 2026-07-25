import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

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
  /** Supportive, borrower-facing one-liner about the tone. */
  blurb: string;
}

export interface ChatInsights {
  /** Plain-English recap of the borrower's Live Chat + Chatbot history. */
  summary: string | null;
  sentiment: ChatSentiment;
  liveChatSessions: number;
  chatbotMessages: number;
  lastContact: string;
}

/**
 * Cognitive (CLL-style) service — mock. Derives a conversation SUMMARY and a
 * SENTIMENT reading from the borrower's Live Chat + Chatbot history.
 *
 * By design (synthetic, no AI call):
 *   - Type 1 (excellent):      positive sentiment, long/engaged summary
 *   - Type 2 (delinquency g1):  negative sentiment, short summary
 *   - Type 3 (delinquency g2):  more negative sentiment, very short or none
 */
@Injectable({ providedIn: 'root' })
export class ChatInsightsService {
  getInsights(user: User): ChatInsights {
    switch (user.userType) {
      case 1:
        return this.forEngaged(user);
      case 2:
        return this.forDelinquentG1(user);
      default:
        return this.forDelinquentG2(user);
    }
  }

  // --- Type 1: fully engaged, positive, long summary -----------------------
  private forEngaged(user: User): ChatInsights {
    const score = Math.min(96, 86 + Math.round(user.onTimeStreak / 12));
    const sessions = 6;
    const bot = 40 + (user.onTimeStreak % 9);
    return {
      summary:
        `Over the past several weeks you've been a highly engaged partner in ` +
        `managing your loan. Across ${sessions} live-chat sessions and ${bot} ` +
        `chatbot messages you set up autopay, compared refinancing options to ` +
        `secure a lower rate, and checked in as you crossed the halfway mark on ` +
        `your balance. Your questions were forward-looking — extra-payment ` +
        `strategies, loyalty rewards, and payoff timelines — and the tone stayed ` +
        `consistently upbeat and collaborative, often thanking the team for quick, ` +
        `clear answers.`,
      sentiment: this.toSentiment(score),
      liveChatSessions: sessions,
      chatbotMessages: bot,
      lastContact: '3 days ago',
    };
  }

  // --- Type 2: delinquency grade 1, negative, short summary ----------------
  private forDelinquentG1(user: User): ChatInsights {
    const score = Math.max(28, 42 - user.paymentsMissed * 2);
    return {
      summary:
        `In your recent chats you raised concerns about a missed payment and ` +
        `asked how to avoid late fees. The conversations were brief and a little ` +
        `tense, but you were looking for a workable path forward.`,
      sentiment: this.toSentiment(score),
      liveChatSessions: 2,
      chatbotMessages: 9 + user.paymentsMissed,
      lastContact: '2 weeks ago',
    };
  }

  // --- Type 3: delinquency grade 2, more negative, very short or none ------
  private forDelinquentG2(user: User): ChatInsights {
    const score = Math.max(8, 20 - user.paymentsMissed);
    // Heaviest delinquency (many missed payments) has effectively no usable
    // conversation history to summarize.
    const noHistory = user.paymentsMissed >= 9;
    return {
      summary: noHistory
        ? null
        : `Your last chat was short and frustrated — mostly about the past-due balance.`,
      sentiment: this.toSentiment(score),
      liveChatSessions: noHistory ? 0 : 1,
      chatbotMessages: noHistory ? 2 : 4,
      lastContact: noHistory ? 'over 6 weeks ago' : '6 weeks ago',
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
