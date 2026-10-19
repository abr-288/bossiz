import { describe, it, expect } from 'vitest';
import { getTripTypeLabel } from './tripType';

describe('getTripTypeLabel', () => {
  it('returns round trip when a return date is provided', () => {
    expect(getTripTypeLabel('2026-07-15', (key: string) => {
      if (key === 'booking.dialog.flight.roundTrip') return 'Aller-retour';
      return 'Aller simple';
    })).toBe('Aller-retour');
  });

  it('returns one way when no return date is provided', () => {
    expect(getTripTypeLabel(undefined, (key: string) => {
      if (key === 'booking.dialog.flight.roundTrip') return 'Aller-retour';
      return 'Aller simple';
    })).toBe('Aller simple');
  });
});
