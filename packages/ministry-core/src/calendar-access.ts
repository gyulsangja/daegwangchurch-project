import type {Actor} from './directory';

// Public church content never implies permission to read pastoral records.
export function canReadPastoralCalendar(actor:Actor) {
  return Boolean(actor.id && actor.churchId && ['ADMIN','OFFICE'].includes(actor.role) && actor.permissions?.includes('CARE'));
}
