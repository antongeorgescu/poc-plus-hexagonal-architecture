/**
 * PORTS · DRIVING (inbound / primary) — EligibilityPort.
 * PURE TypeScript, ZERO @angular. The interface any driver calls to obtain a
 * rate-relief eligibility DECISION. The decision is made inside the hexagon,
 * never by the CLL/AI — a driver may only phrase the outcome.
 */
import { User } from '../../core/domain/user.entity';
import { RateReliefOutcome } from '../../core/domain/eligibility.entity';

export interface EligibilityPort {
  checkRateRelief(user: User): RateReliefOutcome;
}
