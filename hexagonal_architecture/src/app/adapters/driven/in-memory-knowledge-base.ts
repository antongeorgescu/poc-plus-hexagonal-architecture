/**
 * ADAPTERS · DRIVEN (secondary) — In-memory knowledge base.
 * IMPLEMENTS the KnowledgeBasePort. Grounding source only (synthetic job
 * catalog); it computes no money and decides no eligibility.
 */
import { KnowledgeBasePort } from '../../ports/driven/knowledge-base.port';
import { JobPosting } from '../../core/domain/job-posting.type';

export class InMemoryKnowledgeBase implements KnowledgeBasePort {
  getJobsForProgram(program: string, location: string): JobPosting[] {
    const loc = location;
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
      catalog[program] ?? [
        { title: 'Customer Service Representative', company: 'Regional Services Group', location: loc, salary: '$20 / hr', type: 'Full-time' },
        { title: 'Administrative Assistant', company: 'Community Partners', location: loc, salary: '$22 / hr', type: 'Full-time' },
      ]
    );
  }
}
