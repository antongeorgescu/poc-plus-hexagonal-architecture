/**
 * CORE · DOMAIN — Shared kernel: the inquiry topic taxonomy.
 * PURE TypeScript, ZERO @angular.
 *
 * This is the one inquiry declaration that genuinely crosses rings — the core
 * region, both port sides, and both model adapters all name it. It carries no
 * rule of its own: what a category *means* lives in `CATEGORY_DESCRIPTION`, and
 * what it *earns* lives in `DETERMINISM_POLICY` — both are business settings
 * bound at the composition root (`configuration/inquiry.policy.config.ts`) and
 * APPLIED by `core/cognitive/inquiry.service.ts` against the contract in
 * `core/cognitive/inquiry.policy.ts`.
 *
 * The shapes that used to live here now sit with the port that owns them:
 *   · InquiryResult      → ports/driving/inquiry.port.ts
 *   · CategoryDescriptor → ports/driven/language-model.port.ts
 */
export type InquiryCategory =
  | 'NEXT_PAYMENT'
  | 'LOAN_BALANCE'
  | 'EXTRA_PAYMENT'
  | 'PROFILE_UPDATE'
  | 'PAYMENT_HISTORY'
  | 'PROFILE_HISTORY'
  | 'HARDSHIP'
  | 'LIFE_EVENT'
  | 'REPAYMENT_OPTIONS'
  | 'GENERAL';
