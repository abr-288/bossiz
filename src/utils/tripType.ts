export const getTripTypeLabel = (
  returnDate?: string,
  t?: (key: string) => string,
): string => {
  if (!t) return returnDate ? 'Aller-retour' : 'Aller simple';
  return returnDate ? t('booking.dialog.flight.roundTrip') : t('booking.dialog.flight.oneWay');
};
