/**
 * CORE · APPLICATION — Rate-relief eligibility use case.
 * PURE TypeScript, ZERO @angular. IMPLEMENTS the driving port (EligibilityPort).
 * The eligibility decision is made by the domain, never by the CLL/AI.
 */
import { EligibilityPort } from '../../ports/driving/eligibility.port';
import { User } from '../domain/user.entity';
import {
  checkRateReliefEligibility,
  RateReliefOutcome,
} from '../domain/eligibility.entity';

export class EligibilityService implements EligibilityPort {
  checkRateRelief(user: User): RateReliefOutcome {
    return checkRateReliefEligibility(user);
  }
}
