import { Injectable } from '@angular/core';
import { User, UserType } from '../models/user.model';

export interface WelcomeContent {
  greeting: string;
  question: string;
  /** Themed suggestion chips shown under the inquiry box. */
  suggestions: string[];
  themeClass: string;
}

/**
 * Owns the per-user-type tone: the welcome greeting, the polite "how can
 * we help" question, the suggested prompts, and the CSS theme class.
 */
@Injectable({ providedIn: 'root' })
export class PersonalizationService {
  getWelcome(user: User): WelcomeContent {
    const name = user.firstName;
    const base: Record<UserType, Omit<WelcomeContent, 'themeClass'>> = {
      1: {
        greeting: `Welcome back, ${name} — you're in excellent standing! 🎉`,
        question: `Thanks for being such a reliable borrower. How can we help you make the most of your account today?`,
        suggestions: [
          "I'd like to know when my next payment is due and its amount",
          "What's the balance of my loan and when's the maturity date?",
          'Do I qualify for a lower interest rate or loyalty rewards?',
        ],
      },
      2: {
        greeting: `Hi ${name}, good to see you.`,
        question: `We're here to help you stay on track. What can we help you with today?`,
        suggestions: [
          "I'd like to know when my next payment is due and its amount",
          "What's the balance of my loan and when's the maturity date?",
          'I may miss a few payments — what are my options?',
        ],
      },
      3: {
        greeting: `Hello ${name}, we're glad you're here.`,
        question: `We understand things can get tough, and we're here to help you find a path forward. How can we support you today?`,
        suggestions: [
          'I may not be able to make payments — I lost my job',
          'I just had my first child — do I qualify for interest rate relief?',
          "What's the balance of my loan and when's the maturity date?",
        ],
      },
    };

    return { ...base[user.userType], themeClass: `theme-${user.userType}` };
  }
}
