import { Injectable } from '@angular/core';
import {
  InquiryCategory,
  InquiryResult,
  JobPosting,
} from '../models/inquiry.model';
import { User } from '../models/user.model';

interface CategoryRule {
  category: InquiryCategory;
  deterministic: boolean;
  label: string;
  keywords: RegExp[];
}

/**
 * Mock inquiry engine. In a real system this would call an AI service;
 * here we classify free text with simple keyword matching and return
 * synthetic, deterministic answers.
 */
@Injectable({ providedIn: 'root' })
export class InquiryService {
  private rules: CategoryRule[] = [
    {
      // Must precede LOAN_BALANCE so "...to my loan balance" doesn't match balance first.
      category: 'EXTRA_PAYMENT',
      deterministic: true,
      label: 'Make a payment',
      keywords: [
        /extra payment/i,
        /make an? (extra |additional )?payment/i,
        /additional payment/i,
        /pay(ing)? (extra|more|down|off early|ahead)/i,
        /lump sum/i,
        /principal/i,
      ],
    },
    {
      category: 'PROFILE_UPDATE',
      deterministic: true,
      label: 'Update your profile',
      keywords: [
        /update (my )?(profile|contact|email|phone|mailing|address|information|info|details)/i,
        /change (my )?(email|phone|mailing|address|contact|profile)/i,
        /(update|change|edit|fix).*(contact|profile|details)/i,
        /new (email|phone|mailing|address)/i,
        /email address/i,
        /phone number/i,
        /mailing address/i,
        /i (just )?moved/i,
      ],
    },
    {
      category: 'NEXT_PAYMENT',
      deterministic: true,
      label: 'Next payment',
      keywords: [/next payment/i, /due/i, /when.*(pay|payment)/i, /how much.*pay/i],
    },
    {
      category: 'LOAN_BALANCE',
      deterministic: true,
      label: 'Loan balance & maturity',
      keywords: [/balance/i, /maturity/i, /payoff/i, /pay ?off/i, /how much.*owe/i],
    },
    {
      category: 'HARDSHIP',
      deterministic: false,
      label: 'Payment hardship',
      keywords: [
        /lost my job/i,
        /unemploy/i,
        /can'?t (make|afford)/i,
        /cannot (make|afford)/i,
        /miss.*payment/i,
        /struggl/i,
        /hardship/i,
        /laid off/i,
      ],
    },
    {
      category: 'LIFE_EVENT',
      deterministic: false,
      label: 'Life event & rate relief',
      keywords: [
        /child/i,
        /baby/i,
        /born/i,
        /newborn/i,
        /interest rate relief/i,
        /rate relief/i,
        /qualify/i,
        /married/i,
        /relief/i,
      ],
    },
  ];

  classify(text: string): InquiryResult {
    for (const rule of this.rules) {
      if (rule.keywords.some((k) => k.test(text))) {
        return {
          category: rule.category,
          deterministic: rule.deterministic,
          label: rule.label,
        };
      }
    }
    return { category: 'GENERAL', deterministic: false, label: 'General help' };
  }

  /** Mock job board keyed by the borrower's program of study + location. */
  getJobsForProgram(user: User): JobPosting[] {
    const loc = `${user.city}, ${user.state}`;
    const catalog: Record<string, JobPosting[]> = {
      'Computer Science': [
        { title: 'Junior Software Engineer', company: 'Brightloop Systems', location: loc, salary: '$82,000 / yr', type: 'Full-time' },
        { title: 'IT Support Specialist', company: 'Nimbus Cloud', location: loc, salary: '$28 / hr', type: 'Contract' },
        { title: 'QA Analyst', company: 'Ledgerline', location: loc, salary: '$68,000 / yr', type: 'Full-time' },
      ],
      'Registered Nursing': [
        { title: 'Registered Nurse — Med/Surg', company: 'Cascade Health', location: loc, salary: '$41 / hr', type: 'Full-time' },
        { title: 'Home Health Nurse', company: 'CareBridge', location: loc, salary: '$38 / hr', type: 'Part-time' },
        { title: 'Clinic Triage Nurse', company: 'Summit Family Clinic', location: loc, salary: '$76,000 / yr', type: 'Full-time' },
      ],
      'Mechanical Engineering': [
        { title: 'Mechanical Design Engineer', company: 'Peak Manufacturing', location: loc, salary: '$79,000 / yr', type: 'Full-time' },
        { title: 'Maintenance Technician', company: 'Front Range Foods', location: loc, salary: '$31 / hr', type: 'Full-time' },
        { title: 'CAD Drafter', company: 'Alpine Fabrication', location: loc, salary: '$26 / hr', type: 'Contract' },
      ],
      'Marketing': [
        { title: 'Digital Marketing Coordinator', company: 'Buckeye Media', location: loc, salary: '$54,000 / yr', type: 'Full-time' },
        { title: 'Social Media Associate', company: 'Grove & Co.', location: loc, salary: '$22 / hr', type: 'Part-time' },
        { title: 'Content Marketing Specialist', company: 'Northstar SaaS', location: loc, salary: '$61,000 / yr', type: 'Full-time' },
      ],
      'Graphic Design': [
        { title: 'Junior Graphic Designer', company: 'Rose City Creative', location: loc, salary: '$52,000 / yr', type: 'Full-time' },
        { title: 'Production Artist', company: 'Willamette Print', location: loc, salary: '$24 / hr', type: 'Contract' },
        { title: 'UI/UX Design Intern', company: 'Bridgetown Apps', location: loc, salary: '$21 / hr', type: 'Part-time' },
      ],
      'Culinary Arts': [
        { title: 'Line Cook', company: 'Bayfront Bistro', location: loc, salary: '$23 / hr', type: 'Full-time' },
        { title: 'Pastry Assistant', company: 'Sunrise Bakery', location: loc, salary: '$20 / hr', type: 'Part-time' },
        { title: 'Kitchen Supervisor', company: 'Ocean Grill Group', location: loc, salary: '$49,000 / yr', type: 'Full-time' },
      ],
    };

    return (
      catalog[user.programOfStudy] ?? [
        { title: 'Customer Service Representative', company: 'Regional Services Group', location: loc, salary: '$20 / hr', type: 'Full-time' },
        { title: 'Administrative Assistant', company: 'Community Partners', location: loc, salary: '$22 / hr', type: 'Full-time' },
      ]
    );
  }

  /**
   * Mock eligibility check for a "new child" interest-rate relief program.
   * Rules are synthetic but deterministic so demos are repeatable.
   */
  checkRateReliefEligibility(user: User): {
    eligible: boolean;
    proposedRate: number;
    estimatedMonthlySavings: number;
    reason: string;
  } {
    const reduction = user.userType === 1 ? 0.75 : user.userType === 2 ? 0.5 : 0.35;
    const proposedRate = Math.max(0, user.interestRate - reduction);

    // Simple synthetic amortization delta for the messaging.
    const oldMonthlyInterest = (user.currentBalance * (user.interestRate / 100)) / 12;
    const newMonthlyInterest = (user.currentBalance * (proposedRate / 100)) / 12;
    const estimatedMonthlySavings =
      Math.round((oldMonthlyInterest - newMonthlyInterest) * 100) / 100;

    const eligible = user.userType !== 3 || user.paymentsMade >= 6;
    const reason = eligible
      ? 'A qualifying life event (new dependent) was detected and your account meets the program requirements.'
      : 'Your account is currently past due. Clearing the outstanding balance unlocks eligibility for the new-child rate relief.';

    return { eligible, proposedRate, estimatedMonthlySavings, reason };
  }
}
