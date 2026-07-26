/**
 * APPLICATION — Use case. PURE TypeScript, ZERO @angular.
 * All validation and money math live in the Payment entity; this interactor
 * just exposes them as an application operation.
 */
import { User } from '../../domain/user.entity';
import {
  fundingSources,
  processPayment,
  suggestExtraPayment,
  PaymentRequest,
  PaymentResult,
} from '../../domain/payment.entity';

export class SubmitPayment {
  execute(user: User, request: PaymentRequest): PaymentResult {
    return processPayment(user, request);
  }

  suggestedAmount(user: User): number {
    return suggestExtraPayment(user);
  }

  fundingSources(): string[] {
    return fundingSources();
  }
}
