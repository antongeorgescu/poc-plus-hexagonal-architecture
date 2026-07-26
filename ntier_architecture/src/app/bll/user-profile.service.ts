import { Injectable } from '@angular/core';
import { User, UserType, USER_TYPE_LABEL } from '../models/user.model';

export interface BorrowerProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  programOfStudy: string;
  city: string;
  state: string;
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

export interface ProfileUpdateResult {
  success: boolean;
  message: string;
  referenceNumber?: string;
  updated?: ProfileContact;
}

/**
 * BLL — deterministic collector of borrower (profile) information for the
 * logged-in user. No cognition here: it reads the authoritative record and
 * returns plain facts, including the rule-derived account standing.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  getProfile(user: User): BorrowerProfile {
    const { label, tone, summary } = this.standing(user.userType);
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      programOfStudy: user.programOfStudy,
      city: user.city,
      state: user.state,
      location: `${user.city}, ${user.state}`,
      creditScore: user.creditScore,
      userType: user.userType,
      standingLabel: label,
      standingTone: tone,
      standingSummary: summary,
    };
  }

  /** Current (mock) contact details to pre-fill the update form. */
  getContact(user: User): ProfileContact {
    return {
      email: `${user.firstName}.${user.lastName}@example.com`.toLowerCase(),
      phone: '',
      mailingAddress: this.canadianAddress(user),
    };
  }

  /**
   * Synthetic Canadian mailing address, formatted as:
   *   "<street no.> <street name>, <city>, <Province full name>, <AB>  <postal code>"
   */
  private canadianAddress(user: User): string {
    const map: Record<string, string> = {
      alice: '128 Maple Street, Toronto, Ontario, ON  M5V 2T6',
      grace: '455 Granville Street, Vancouver, British Columbia, BC  V6C 1T1',
      bob: '72 Stephen Avenue SW, Calgary, Alberta, AB  T2P 1J9',
      henry: '310 Portage Avenue, Winnipeg, Manitoba, MB  R3C 0B1',
      carol: '1200 Rue Sainte-Catherine O, Montreal, Quebec, QC  H3B 1H6',
      irene: '88 Spring Garden Road, Halifax, Nova Scotia, NS  B3J 1G1',
    };
    return (
      map[user.username.toLowerCase()] ??
      '100 Main Street, Ottawa, Ontario, ON  K1P 1J1'
    );
  }

  /**
   * Deterministic profile update: validates the requested contact changes,
   * applies them, and returns an authoritative confirmation with a reference.
   * No cognition — pure rule-based validation and persistence.
   */
  updateProfile(user: User, request: ProfileContact): ProfileUpdateResult {
    const current = this.getContact(user);
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
      referenceNumber: this.generateReference(),
      updated,
    };
  }

  /** Reference format: PRF-YYYYMMDD-XXXXXX (uppercase alphanumeric). */
  private generateReference(): string {
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

  private standing(type: UserType): {
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
}
