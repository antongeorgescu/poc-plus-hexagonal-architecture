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

export class PersonalizationService implements PersonalizationPort {
  constructor(private readonly languageModel: LanguageModelPort) {}

  getWelcome(user: User): WelcomeContent {
    const copy = this.languageModel.composeWelcome(user);

    // Theme policy is ours, not the model's.
    return { ...copy, themeClass: `theme-${user.userType}` };
  }
}
