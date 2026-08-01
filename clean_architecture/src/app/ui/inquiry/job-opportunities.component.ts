import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../domain/user.entity';
import { JobPosting } from '../../domain/inquiry';
import { INQUIRY_SERVICE } from '../../infrastructure/tokens';

/**
 * UI — PERSONALIZED answer component (HARDSHIP).
 * The messaging tone adapts to the user type, but the core value — matching
 * jobs in the borrower's field and area based on their program of study — is
 * shown to anyone who reports a hardship.
 *
 * The postings are read-only GROUNDING: they arrive through the CLL
 * InquiryService, behind which `KnowledgeBasePort` supplies them. Nothing here
 * is a system of record and nothing here decides an outcome.
 */
@Component({
  selector: 'app-job-opportunities',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card__eyebrow">Payment hardship support</div>
      <h3>{{ headline }}</h3>
      <p class="muted">{{ intro }}</p>

      <div class="callout">
        <strong>Good news:</strong> based on your program of study
        (<em>{{ user.programOfStudy }}</em>) we found current openings near
        {{ user.city }}, {{ user.state }}.
      </div>

      <div class="jobs">
        @for (job of jobs; track job.title) {
          <div class="job">
            <div class="job__main">
              <span class="job__title">{{ job.title }}</span>
              <span class="job__company">{{ job.company }} · {{ job.location }}</span>
            </div>
            <div class="job__meta">
              <span class="pill pill--good">{{ job.salary }}</span>
              <span class="muted small">{{ job.type }}</span>
            </div>
          </div>
        }
      </div>

      <div class="actions">
        <button class="btn">Request a payment pause</button>
        <button class="btn btn--ghost">Talk to a specialist</button>
      </div>
    </section>
  `,
  styles: [
    `
      .callout {
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 0.9rem 0;
        font-size: 0.92rem;
      }
      .jobs {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .job {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid var(--border);
        border-radius: 10px;
      }
      .job__main {
        display: flex;
        flex-direction: column;
      }
      .job__title {
        font-weight: 600;
      }
      .job__company {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
      .job__meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
      }
      .small {
        font-size: 0.78rem;
      }
      .actions {
        display: flex;
        gap: 0.6rem;
        margin-top: 1.1rem;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class JobOpportunitiesComponent implements OnInit {
  @Input({ required: true }) user!: User;
  private inquiry = inject(INQUIRY_SERVICE);

  jobs: JobPosting[] = [];
  headline = '';
  intro = '';

  ngOnInit(): void {
    // Grounding lookup — synchronous: this reads the knowledge base, not a model.
    this.jobs = this.inquiry.getJobsForProgram(this.user);

    switch (this.user.userType) {
      case 1:
        this.headline = "Let's protect your great payment history";
        this.intro =
          'You have a strong track record, so you qualify for a streamlined forbearance with no impact to your standing while you search.';
        break;
      case 2:
        this.headline = 'We can help you avoid falling further behind';
        this.intro =
          'Given your recent missed payments, a short forbearance plus a fresh income source can help you get back on schedule.';
        break;
      default:
        this.headline = "We're here to help you get back on your feet";
        this.intro =
          'Your account is past due, but we have hardship options and can connect you with work in your field right away.';
    }
  }
}
