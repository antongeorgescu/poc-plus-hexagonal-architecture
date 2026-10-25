/**
 * CORE · COGNITIVE — Presentation tone per user type: the welcome greeting, the
 * polite "how can we help" question, suggested prompts, and the CSS theme class.
 * PURE TypeScript, ZERO @angular.
 *
 * The copy itself is model output (behind LanguageModelPort); the mapping from a
 * borrower's type to a theme is business policy and stays here. Pure
 * phrasing/theming either way — it decides nothing authoritative.
 */
import { PersonalizationPort, WelcomeContent } from '../../ports/driving/personalization.port';
import { LanguageModelPort } from '../../ports/driven/language-model.port';
import { User } from '../domain/user.entity';

/**
 * Fixed questions that open the two record look-ups. They are business-owned, not
 * model output, so they appear whichever language-model adapter is bound — a model
 * that writes three suggestions of its own still gets these two appended. Each one
 * is worded to land on PAYMENT_HISTORY / PROFILE_HISTORY respectively.
 */
const RECORD_SUGGESTIONS: readonly string[] = [
  'Show me my payment history',
  'Show me my profile update history',
];

export class PersonalizationService implements PersonalizationPort {
  constructor(private readonly languageModel: LanguageModelPort) {}

  async getWelcome(user: User): Promise<WelcomeContent> {
    const copy = await this.languageModel.composeWelcome(user);

    // Theme policy is ours, not the model's.
    return {
      ...copy,
      suggestions: [...copy.suggestions, ...RECORD_SUGGESTIONS],
      themeClass: `theme-${user.userType}`,
    };
  }
}
