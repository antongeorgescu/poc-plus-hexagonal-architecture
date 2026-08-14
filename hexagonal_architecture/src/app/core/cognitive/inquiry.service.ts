/**
 * CORE · COGNITIVE — Cognitive Logic Layer. It PROPOSES; it does not decide.
 * PURE TypeScript, ZERO @angular.
 *
 * This service implements InquiryPort, a cognitive DRIVING port on the same edge
 * of the hexagon as PaymentPort. It is inside the core because what it holds is
 * POLICY, not technology: it is the layer that APPLIES the determinism map and
 * the topic labels. The model — which merely *proposes* a category — sits
 * outside, behind LanguageModelPort. Grounding arrives through KnowledgeBasePort.
 *
 * The policy VALUES are injected from the composition root
 * (`configuration/inquiry.policy.config.ts`) against the contract in
 * `./inquiry.policy.ts`, so a servicer can tune the taxonomy per deployment
 * without editing the core. Nothing here imports that file: the core names the
 * interface, exactly as it does for every port.
 *
 * The `deterministic` flag is therefore set by the business, NOT by any AI: even
 * if the model proposes a wrong category, it cannot promote a topic to
 * deterministic or demote one out of it.
 */
import { InquiryCategory } from '../domain/inquiry.type';
import { JobPosting } from '../domain/job-posting.type';
import { User } from '../domain/user.entity';
import { InquiryPort, InquiryResult } from '../../ports/driving/inquiry.port';
import {
  CategoryDescriptor,
  LanguageModelPort,
} from '../../ports/driven/language-model.port';
import { KnowledgeBasePort } from '../../ports/driven/knowledge-base.port';
import { InquiryPolicy } from './inquiry.policy';

export class InquiryService implements InquiryPort {
  /**
   * What the classifier may choose from. GENERAL is deliberately EXCLUDED: it is
   * the absence of a match, not a match. Offering it would let the model "pick"
   * the fallback and destroy the distinction between a proposal and an
   * abstention, which is the signal this layer relies on.
   *
   * Derived once at construction from the injected descriptions — the exclusion
   * rule is the core's, even though the wording is configured.
   */
  private readonly matchableCategories: readonly CategoryDescriptor[];

  constructor(
    private readonly languageModel: LanguageModelPort,
    private readonly knowledgeBase: KnowledgeBasePort,
    private readonly policy: InquiryPolicy
  ) {
    this.matchableCategories = (
      Object.keys(policy.descriptions) as InquiryCategory[]
    )
      .filter((c) => c !== 'GENERAL')
      .map((category) => ({ category, description: policy.descriptions[category] }));
  }

  async classify(text: string): Promise<InquiryResult> {
    // The model PROPOSES a category (or nothing); this layer decides what that
    // proposal is worth and stamps the fixed policy onto it. Awaiting a remote
    // model changes NOTHING about who decides: an unusable proposal still
    // collapses to GENERAL, and the determinism policy below is still ours.
    // The candidate list travels WITH the request, so the adapter never keeps a
    // copy of the taxonomy. A semantic adapter matches the wording against each
    // description; the keyword adapter ignores them. Either way an abstention
    // (null) collapses to GENERAL here, in the core.
    const category =
      (await this.languageModel.classifyInquiry(text, this.matchableCategories)) ??
      'GENERAL';

    return {
      category,
      deterministic: this.policy.determinism[category],
      label: this.policy.labels[category],
    };
  }

  /** Grounding pass-through — reads the KB driven port (never a system of record). */
  getJobsForProgram(user: User): Promise<JobPosting[]> {
    return this.knowledgeBase.getJobsForProgram(
      user.programOfStudy,
      `${user.city}, ${user.province}`
    );
  }
}
