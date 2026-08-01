/**
 * PORTS · DRIVING (inbound / primary) — PersonalizationPort.
 * PURE TypeScript, ZERO @angular.
 *
 * A COGNITIVE driving port: the interface a driver calls for the welcome copy and
 * theme appropriate to a borrower. Tone and phrasing only — nothing here gates
 * access or computes an amount.
 */
import { User } from '../../core/domain/user.entity';

export interface WelcomeContent {
  greeting: string;
  question: string;
  suggestions: string[];
  themeClass: string;
}

export interface PersonalizationPort {
  getWelcome(user: User): Promise<WelcomeContent>;
}
