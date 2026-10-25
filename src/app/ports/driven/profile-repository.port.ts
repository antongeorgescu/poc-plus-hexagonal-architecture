/**
 * PORTS · DRIVEN (outbound / secondary) — ProfileRepositoryPort.
 * PURE TypeScript, ZERO @angular. The core OWNS this interface: it is how a contact
 * update the domain has already VALIDATED gets stored. It never validates or
 * decides — it persists a finished outcome and reports back, so the core never
 * names a database, an HTTP endpoint or a table.
 */
import { User } from '../../core/domain/user.entity';
import { ProfileContact, ProfileUpdateEntry } from '../../core/domain/borrower.entity';

/** One accepted contact update: who, the reference they were shown, the new values. */
export interface ProfileRecord {
  username: string;
  referenceNumber: string;
  updated: ProfileContact;
}

/** A failed write is a value, not an exception (see PORTS.md conventions). */
export interface ProfileRecordOutcome {
  success: boolean;
  message: string;
  /** The borrower as now stored — the source of truth after a successful write. */
  user?: User;
}

/** The stored update log for one borrower, in no particular order (the domain orders it). */
export interface ProfileHistoryOutcome {
  success: boolean;
  message: string;
  entries: ProfileUpdateEntry[];
}

export interface ProfileRepositoryPort {
  save(profile: ProfileRecord): Promise<ProfileRecordOutcome>;
  /** Every contact update recorded for this borrower. A failed read is `success: false`. */
  history(username: string): Promise<ProfileHistoryOutcome>;
}
