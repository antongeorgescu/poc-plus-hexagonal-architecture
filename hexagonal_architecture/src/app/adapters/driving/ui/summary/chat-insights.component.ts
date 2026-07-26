import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/domain/user.entity';
import { ChatInsights } from '../../cll/chat-insights.service';
import { CHAT_INSIGHTS_SERVICE } from '../../../../configuration/tokens';

/**
 * ADAPTERS · DRIVING · UI — Always-on shared card. Presents the CLL's
 * conversation summary and a friendly sentiment tone-meter. All content comes
 * from ChatInsightsService (which reads the ChatHistory driven port); the UI
 * only renders.
 */
@Component({
  selector: 'app-chat-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Conversation insights</div>
      <h3>Your conversations with us</h3>
      <p class="muted">
        A quick recap of your recent Live Chat and Chatbot activity, and how those
        conversations have felt.
      </p>

      <div class="sentiment">
        <div class="sentiment__head">
          <span class="sentiment__emoji">{{ insights.sentiment.emoji }}</span>
          <div>
            <span class="sentiment__label">Overall tone</span>
            <span
              class="pill"
              [class.pill--good]="insights.sentiment.tone === 'good'"
              [class.pill--warn]="insights.sentiment.tone === 'warn'"
              [class.pill--bad]="insights.sentiment.tone === 'bad'"
            >
              {{ insights.sentiment.label }}
            </span>
          </div>
        </div>

        <div
          class="meter"
          role="meter"
          aria-label="Conversation sentiment"
          [attr.aria-valuenow]="insights.sentiment.score"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="meter__track"></div>
          <div class="meter__needle" [style.left.%]="insights.sentiment.score">
            <span class="meter__value">{{ insights.sentiment.score }}</span>
          </div>
        </div>
        <div class="meter__scale">
          <span>Very negative</span>
          <span>Neutral</span>
          <span>Very positive</span>
        </div>

        <p class="sentiment__blurb">{{ insights.sentiment.blurb }}</p>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="stat__label">Live chat sessions</span>
          <span class="stat__value">{{ insights.liveChatSessions }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Chatbot messages</span>
          <span class="stat__value">{{ insights.chatbotMessages }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Last contact</span>
          <span class="stat__value">{{ insights.lastContact }}</span>
        </div>
      </div>

      <div class="summary">
        <h4>Summary</h4>
        @if (insights.summary) {
          <p>{{ insights.summary }}</p>
        } @else {
          <p class="muted empty">
            There isn't enough recent conversation to summarize yet. Start a chat
            anytime — we'll pick up right where you left off.
          </p>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .sentiment {
        margin: 1rem 0 0.4rem;
      }
      .sentiment__head {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 0.9rem;
      }
      .sentiment__emoji {
        font-size: 2.2rem;
        line-height: 1;
      }
      .sentiment__label {
        display: block;
        font-size: 0.78rem;
        color: var(--text-muted);
        margin-bottom: 0.25rem;
      }
      .meter {
        position: relative;
        padding-top: 0.4rem;
      }
      .meter__track {
        height: 12px;
        border-radius: 999px;
        background: linear-gradient(
          90deg,
          #dc2626 0%,
          #f59e0b 50%,
          #16a34a 100%
        );
      }
      .meter__needle {
        position: absolute;
        top: 0;
        transform: translateX(-50%);
        transition: left 0.6s ease;
      }
      .meter__needle::after {
        content: '';
        display: block;
        width: 4px;
        height: 20px;
        margin: 0 auto;
        background: var(--text);
        border-radius: 2px;
        box-shadow: 0 0 0 3px var(--surface);
      }
      .meter__value {
        position: absolute;
        top: -1.35rem;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text);
      }
      .meter__scale {
        display: flex;
        justify-content: space-between;
        font-size: 0.72rem;
        color: var(--text-muted);
        margin-top: 0.5rem;
      }
      .sentiment__blurb {
        margin: 0.9rem 0 0;
        font-size: 0.95rem;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.9rem;
        padding: 1rem 0;
        margin-top: 0.6rem;
        border-top: 1px solid var(--border);
      }
      .summary {
        border-top: 1px solid var(--border);
        padding-top: 1rem;
      }
      .summary h4 {
        color: var(--brand-dark);
        margin-bottom: 0.35rem;
      }
      .summary p {
        margin: 0;
      }
      .empty {
        font-style: italic;
      }
    `,
  ],
})
export class ChatInsightsComponent implements OnInit {
  @Input({ required: true }) user!: User;
  private chat = inject(CHAT_INSIGHTS_SERVICE);

  insights!: ChatInsights;

  ngOnInit(): void {
    this.insights = this.chat.getInsights(this.user);
  }
}
