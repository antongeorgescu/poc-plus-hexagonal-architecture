/**
 * CORE · APPLICATION — Payment use case.
 * PURE TypeScript, ZERO @angular. IMPLEMENTS the driving port (PaymentPort).
 * All validation and money math live in the Payment entity; this application
 * service just exposes them as authoritative operations behind the port.
 */
import { PaymentPort } from '../../ports/driving/payment.port';
import { User } from '../domain/user.entity';
import {
  buildPaymentSnapshot,
  fundingSources,
  processPayment,
  suggestExtraPayment,
  PaymentRequest,
  PaymentResult,
  PaymentSnapshot,
} from '../domain/payment.entity';

export class PaymentService implements PaymentPort {
  getSnapshot(user: User): PaymentSnapshot {
    return buildPaymentSnapshot(user);
  }

  submit(user: User, request: PaymentRequest): PaymentResult {
    return processPayment(user, request);
  }

  suggestedAmount(user: User): number {
    return suggestExtraPayment(user);
  }

  fundingSources(): string[] {
    return fundingSources();
  }
}
