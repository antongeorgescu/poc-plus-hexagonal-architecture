/**
 * APPLICATION — Use case. PURE TypeScript, ZERO @angular.
 * The eligibility decision is made by the domain, never by the CLL/AI.
 */
import { User } from '../../domain/user.entity';
import {
  checkRateReliefEligibility,
  RateReliefOutcome,
} from '../../domain/eligibility.entity';

export class CheckRateReliefEligibility {
  execute(user: User): RateReliefOutcome {
    return checkRateReliefEligibility(user);
  }
}
