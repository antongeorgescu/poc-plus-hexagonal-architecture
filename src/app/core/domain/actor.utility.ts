/**
 * CORE · DOMAIN — Reading the created_by value on a history record.
 * PURE TypeScript, ZERO @angular.
 *
 * The record stores '<kind>:<identity>': 'user:alice' (the borrower, in self-service) or
 * 'agent:mlevesque' (servicing staff acting for the borrower). This turns it into the
 * two things a screen needs, so no component parses the string itself.
 */
export interface Actor {
  kind: 'user' | 'agent';
  /** The part after the colon: the username, or the agent id. */
  identity: string;
}

export function parseActor(createdBy: string): Actor {
  const i = createdBy.indexOf(':');
  const kind = createdBy.slice(0, i);
  const identity = createdBy.slice(i + 1);
  // Anything that is not clearly an agent is shown as the account holder's own action.
  return { kind: kind === 'agent' ? 'agent' : 'user', identity };
}

/** Short wording for a history row: 'You' for the signed-in borrower, 'Agent <id>' for staff. */
export function describeActor(createdBy: string, signedInUsername: string): string {
  const actor = parseActor(createdBy);
  if (actor.kind === 'agent') return `Agent ${actor.identity}`;
  return actor.identity.toLowerCase() === signedInUsername.toLowerCase() ? 'You' : actor.identity;
}
