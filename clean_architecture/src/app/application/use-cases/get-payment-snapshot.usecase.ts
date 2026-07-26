/**
 * APPLICATION — Use case. PURE TypeScript, ZERO @angular.
 * Deterministic payment posture, computed by the Payment entity.
 */
import { User } from '../../domain/user.entity';
import { buildPaymentSnapshot, PaymentSnapshot } from '../../domain/payment.entity';

export class GetPaymentSnapshot {
  execute(user: User): PaymentSnapshot {
    return buildPaymentSnapshot(user);
  }
}
