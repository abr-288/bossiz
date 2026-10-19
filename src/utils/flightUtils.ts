import { currentLocaleTag } from "@/lib/dateLocale";
/**
 * Flight utility functions for calculating and formatting flight data
 */

export interface FlightTimes {
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  duration: string;
  durationMinutes: number;
  isNextDay: boolean;
  isMultiDay: boolean;
  daysDifference: number;
}

/**
 * Parse ISO datetime string and return date/time components
 */
export const parseFlightDateTime = (isoString: string): { date: string; time: string; dateObj: Date } | null => {
  try {
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) return null;
    
    const date = dateObj.toISOString().split('T')[0];
    const time = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return { date, time, dateObj };
  } catch {
    return null;
  }
};

/**
 * Parse duration string (PT2H30M format or "2h 30m" format)
 */
export const parseDuration = (duration: string): number => {
  if (!duration || duration === 'N/A') return 0;
  
  // ISO 8601 format: PT2H30M
  const isoMatch = duration.match(/PT(\d+)H(?:(\d+)M)?/);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1]) || 0;
    const minutes = parseInt(isoMatch[2]) || 0;
    return hours * 60 + minutes;
  }
  
  // Simple format: 2h 30m or 2h30m
  const simpleMatch = duration.match(/(\d+)\s*h\s*(?:(\d+)\s*m)?/i);
  if (simpleMatch) {
    const hours = parseInt(simpleMatch[1]) || 0;
    const minutes = parseInt(simpleMatch[2]) || 0;
    return hours * 60 + minutes;
  }
  
  return 0;
};

/**
 * Format duration from minutes to readable string
 */
export const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return 'N/A';
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
};

/**
 * Calculate flight duration from departure and arrival times
 */
export const calculateDuration = (departure: Date, arrival: Date): number => {
  const diffMs = arrival.getTime() - departure.getTime();
  return Math.round(diffMs / (1000 * 60)); // Convert to minutes
};

/**
 * Calculate arrival time from departure and duration
 */
export const calculateArrivalFromDuration = (departureDate: Date, durationMinutes: number): Date => {
  return new Date(departureDate.getTime() + durationMinutes * 60 * 1000);
};

/**
 * Validate and correct flight times
 * Returns corrected flight data with consistent times
 */
export const validateAndCorrectFlightTimes = (
  departureIso: string,
  arrivalIso: string,
  providedDuration: string,
  departureDate: string
): FlightTimes => {
  const depParsed = parseFlightDateTime(departureIso);
  const arrParsed = parseFlightDateTime(arrivalIso);
  const providedDurationMinutes = parseDuration(providedDuration);
  
  // Default values
  let finalDepartureTime = '00:00';
  let finalArrivalTime = '00:00';
  let finalDepartureDate = departureDate;
  let finalArrivalDate = departureDate;
  let finalDurationMinutes = providedDurationMinutes;
  
  if (depParsed) {
    finalDepartureTime = depParsed.time;
    finalDepartureDate = depParsed.date;
  }
  
  if (arrParsed) {
    finalArrivalTime = arrParsed.time;
    finalArrivalDate = arrParsed.date;
  }
  
  // If we have both dates, calculate actual duration
  if (depParsed && arrParsed) {
    const calculatedDuration = calculateDuration(depParsed.dateObj, arrParsed.dateObj);
    
    // If calculated duration is negative or zero, arrival is wrong
    if (calculatedDuration <= 0) {
      // Use provided duration to calculate correct arrival
      if (providedDurationMinutes > 0) {
        const correctedArrival = calculateArrivalFromDuration(depParsed.dateObj, providedDurationMinutes);
        finalArrivalTime = correctedArrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        finalArrivalDate = correctedArrival.toISOString().split('T')[0];
        finalDurationMinutes = providedDurationMinutes;
      } else {
        // Assume a reasonable 2h30m flight as default
        const defaultDuration = 150; // 2h30m
        const correctedArrival = calculateArrivalFromDuration(depParsed.dateObj, defaultDuration);
        finalArrivalTime = correctedArrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        finalArrivalDate = correctedArrival.toISOString().split('T')[0];
        finalDurationMinutes = defaultDuration;
      }
    } else {
      // Use calculated duration if it seems reasonable
      finalDurationMinutes = calculatedDuration;
    }
  } else if (depParsed && providedDurationMinutes > 0) {
    // We have departure and duration, calculate arrival
    const calculatedArrival = calculateArrivalFromDuration(depParsed.dateObj, providedDurationMinutes);
    finalArrivalTime = calculatedArrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    finalArrivalDate = calculatedArrival.toISOString().split('T')[0];
    finalDurationMinutes = providedDurationMinutes;
  }
  
  // Calculate day difference
  const depDateObj = new Date(finalDepartureDate);
  const arrDateObj = new Date(finalArrivalDate);
  const daysDifference = Math.round((arrDateObj.getTime() - depDateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    departureTime: finalDepartureTime,
    arrivalTime: finalArrivalTime,
    departureDate: finalDepartureDate,
    arrivalDate: finalArrivalDate,
    duration: formatDuration(finalDurationMinutes),
    durationMinutes: finalDurationMinutes,
    isNextDay: daysDifference === 1,
    isMultiDay: daysDifference > 1,
    daysDifference
  };
};

/**
 * Format date for display
 */
export const formatFlightDate = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (format === 'long') {
      return date.toLocaleDateString(currentLocaleTag(), { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    return date.toLocaleDateString(currentLocaleTag(), { 
      day: 'numeric', 
      month: 'short'
    });
  } catch {
    return dateString;
  }
};

/**
 * Format time from ISO string
 */
export const formatTime = (isoString: string): string => {
  const parsed = parseFlightDateTime(isoString);
  return parsed?.time || isoString;
};
