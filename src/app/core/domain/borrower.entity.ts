/**
 * CORE · DOMAIN — Borrower entity (profile, account standing, contact-update rules).
 * PURE TypeScript, ZERO @angular. The rule-derived standing and the contact
 * validation are enterprise business rules, independent of any framework.
 */
import { User, UserType, USER_TYPE_LABEL } from './user.entity';

export interface BorrowerProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  programOfStudy: string;
  city: string;
  province: string;
  location: string;
  creditScore: number;
  userType: UserType;
  standingLabel: string;
  standingTone: 'good' | 'warn' | 'bad';
  standingSummary: string;
}

/** Editable contact details on the borrower profile. */
export interface ProfileContact {
  email: string;
  phone: string;
  mailingAddress: string;
}

/** One accepted contact update, as recorded: the FULL contact as it stood afterwards. */
export interface ProfileUpdateEntry extends ProfileContact {
  id: number;
  referenceNumber: string;
  recordedAt: string; // ISO instant
}

export type ContactField = keyof ProfileContact;

/**
 * `changed` lists the fields this update altered. It is `null` for the earliest
 * update on record: nothing is stored before it, so what it changed is unknowable.
 */
export interface ProfileUpdateHistoryEntry extends ProfileUpdateEntry {
  changed: ContactField[] | null;
}

/** The borrower's contact updates, newest first. `success: false` = the log could not be read. */
export interface ProfileUpdateHistory {
  success: boolean;
  message: string;
  entries: ProfileUpdateHistoryEntry[];
  count: number;
}

export interface ProfileUpdateResult {
  success: boolean;
  message: string;
  referenceNumber?: string;
  updated?: ProfileContact;
  /** The borrower as now STORED; present only after a successful write. */
  updatedUser?: User;
}

/** Deterministic borrower profile including rule-derived account standing. */
export function buildBorrowerProfile(user: User): BorrowerProfile {
  const { label, tone, summary } = standing(user.userType);
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    programOfStudy: user.programOfStudy,
    city: user.city,
    province: user.province,
    location: `${user.city}, ${user.province}`,
    creditScore: user.creditScore,
    userType: user.userType,
    standingLabel: label,
    standingTone: tone,
    standingSummary: summary,
  };
}

const CONTACT_FIELDS: ContactField[] = ['email', 'phone', 'mailingAddress'];

/**
 * Business rule: update history is shown NEWEST FIRST, and each entry says which
 * fields it changed — worked out by comparing it with the update before it.
 */
export function buildProfileUpdateHistory(entries: ProfileUpdateEntry[]): ProfileUpdateHistory {
  const oldestFirst = [...entries].sort(
    (a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id - b.id
  );
  const withChanges = oldestFirst.map((entry, i): ProfileUpdateHistoryEntry => ({
    ...entry,
    changed: i === 0 ? null : CONTACT_FIELDS.filter((f) => entry[f] !== oldestFirst[i - 1][f]),
  }));
  return { success: true, message: '', entries: withChanges.reverse(), count: withChanges.length };
}

/** The borrower's stored contact details, used to pre-fill the update form. */
export function currentContact(user: User): ProfileContact {
  return { email: user.email, phone: user.phone, mailingAddress: user.mailingAddress };
}

/**
 * Deterministic profile update: validates the requested contact changes,
 * works out the resulting details, and returns an authoritative decision with a
 * reference. Storing it is the ProfileRepositoryPort's job, not this function's.
 * Pure rule-based validation — no cognition.
 */
export function applyProfileUpdate(
  user: User,
  request: ProfileContact
): ProfileUpdateResult {
  const current = currentContact(user);
  const email = request.email.trim();
  const phone = request.phone.trim();
  const mailingAddress = request.mailingAddress.trim();

  if (!email && !phone && !mailingAddress) {
    return { success: false, message: 'Please provide at least one detail to update.' };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  const digits = phone.replace(/\D/g, '');
  if (phone && (digits.length < 10 || digits.length > 15)) {
    return { success: false, message: 'Please enter a valid phone number (10–15 digits).' };
  }

  const updated: ProfileContact = {
    email: email || current.email,
    phone: phone || current.phone,
    mailingAddress: mailingAddress || current.mailingAddress,
  };

  return {
    success: true,
    message: 'Your profile has been updated.',
    referenceNumber: generateReference(),
    updated,
  };
}

/** Reference format: PRF-YYYYMMDD-XXXXXX (uppercase alphanumeric). */
function generateReference(): string {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`;
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PRF-${datePart}-${suffix}`;
}

function standing(type: UserType): {
  label: string;
  tone: 'good' | 'warn' | 'bad';
  summary: string;
} {
  switch (type) {
    case 1:
      return {
        label: USER_TYPE_LABEL[1],
        tone: 'good',
        summary:
          'Your account is in excellent standing. Payments are on time and your balance is trending down steadily — you have the strongest tier of borrower benefits available to you.',
      };
    case 2:
      return {
        label: USER_TYPE_LABEL[2],
        tone: 'warn',
        summary:
          "Your account is mostly on track but has a few missed payments (grade 1 delinquency). You're not in serious trouble — a small adjustment like autopay or a revised plan can quickly bring you back to good standing.",
      };
    default:
      return {
        label: USER_TYPE_LABEL[3],
        tone: 'bad',
        summary:
          "Your account is seriously past due (grade 2 delinquency) because payments have stopped. This is fixable — hardship options, a reduced-payment plan, and free counseling are available, and reaching out today won't affect your credit.",
      };
  }
}
