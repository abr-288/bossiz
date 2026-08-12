import { describe, it, expect } from 'vitest';
import {
  flightSearchSchema,
  hotelSearchSchema,
  carRentalSchema,
  paymentSchema,
  passengerSchema,
  eventSearchSchema,
  trainSearchSchema,
  staySearchSchema
} from './validationSchemas';

describe('Validation Schemas', () => {
  describe('flightSearchSchema', () => {
    it('should validate correct flight search data', () => {
      const validData = {
        origin: 'Dakar (DSS)',
        destination: 'Abidjan (ABJ)',
        departureDate: '2099-12-01',
        adults: 2,
        children: 1,
        infants: 0,
        travelClass: 'economy' as const,
        tripType: 'one-way' as const,
      };

      const result = flightSearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject past departure date', () => {
      const invalidData = {
        origin: 'Dakar (DSS)',
        destination: 'Abidjan (ABJ)',
        departureDate: '2020-01-01',
        adults: 1
      };

      const result = flightSearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid IATA codes', () => {
      const invalidData = {
        origin: 'AB',
        destination: 'Abidjan (ABJ)',
        departureDate: '2025-12-01',
        adults: 1
      };

      const result = flightSearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject return date before departure', () => {
      const invalidData = {
        origin: 'Dakar (DSS)',
        destination: 'Abidjan (ABJ)',
        departureDate: '2025-12-10',
        returnDate: '2025-12-05',
        adults: 1
      };

      const result = flightSearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many passengers', () => {
      const invalidData = {
        origin: 'Dakar (DSS)',
        destination: 'Abidjan (ABJ)',
        departureDate: '2025-12-01',
        adults: 10
      };

      const result = flightSearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('hotelSearchSchema', () => {
    it('should validate correct hotel search data', () => {
      const validData = {
        destination: 'Abidjan',
        checkIn: '2099-12-01',
        checkOut: '2099-12-05',
        adults: 2,
        children: 1,
        rooms: 1
      };

      const result = hotelSearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject checkout before checkin', () => {
      const invalidData = {
        destination: 'Abidjan',
        checkIn: '2025-12-10',
        checkOut: '2025-12-05',
        adults: 2,
        rooms: 1
      };

      const result = hotelSearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many rooms', () => {
      const invalidData = {
        destination: 'Abidjan',
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
        adults: 2,
        rooms: 15
      };

      const result = hotelSearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('carRentalSchema', () => {
    it('should validate correct car rental data', () => {
      const validData = {
        pickupLocation: 'Abidjan Aéroport',
        dropoffLocation: 'Abidjan Centre',
        pickupDate: '2099-12-01',
        dropoffDate: '2099-12-05',
        pickupTime: '10:00',
        dropoffTime: '18:00',
        driverAge: 25
      };

      const result = carRentalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        pickupLocation: 'Abidjan',
        pickupDate: '2025-12-01',
        dropoffDate: '2025-12-05',
        pickupTime: '25:00',
        driverAge: 25
      };

      const result = carRentalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject underage driver', () => {
      const invalidData = {
        pickupLocation: 'Abidjan',
        pickupDate: '2025-12-01',
        dropoffDate: '2025-12-05',
        driverAge: 17
      };

      const result = carRentalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentSchema', () => {
    it('should validate correct payment data', () => {
      const validData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+2250708090102',
        customerAddress: '123 Main St',
        customerCity: 'Abidjan',
        paymentMethod: 'card' as const
      };

      const result = paymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        customerName: 'John Doe',
        customerEmail: 'invalid-email',
        customerPhone: '+2250708090102',
        paymentMethod: 'card' as const
      };

      const result = paymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '123',
        paymentMethod: 'card' as const
      };

      const result = paymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should trim and lowercase email', () => {
      const data = {
        customerName: '  John Doe  ',
        customerEmail: '  JOHN@EXAMPLE.COM  ',
        customerPhone: '+2250708090102',
        customerCity: 'Abidjan',
        paymentMethod: 'card' as const
      };

      const result = paymentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerEmail).toBe('john@example.com');
        expect(result.data.customerName).toBe('John Doe');
      }
    });
  });

  describe('passengerSchema', () => {
    it('should validate correct passenger data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        nationality: 'CI',
        documentType: 'passport' as const,
        documentNumber: 'ABC123456'
      };

      const result = passengerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject future date of birth', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2030-01-01',
        nationality: 'CI'
      };

      const result = passengerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too old date of birth', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1800-01-01',
        nationality: 'CI'
      };

      const result = passengerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('eventSearchSchema', () => {
    it('should validate correct event search data', () => {
      const validData = {
        location: 'Abidjan',
        startDate: '2099-12-01',
        endDate: '2099-12-05',
        category: 'concert' as const,
        guests: 2
      };

      const result = eventSearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject a missing start date', () => {
      const validData = {
        location: 'Abidjan',
        guests: 2
      };

      const result = eventSearchSchema.safeParse(validData);
      expect(result.success).toBe(false);
    });
  });

  describe('trainSearchSchema', () => {
    it('should validate correct train search data', () => {
      const validData = {
        origin: 'Abidjan',
        destination: 'Yamoussoukro',
        departureDate: '2099-12-01',
        adults: 2,
        children: 1,
        travelClass: 'first' as const,
      };

      const result = trainSearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require explicit passenger and travel-class values', () => {
      const minimalData = {
        origin: 'Abidjan',
        destination: 'Yamoussoukro',
        departureDate: '2099-12-01',
        adults: 1
      };

      const result = trainSearchSchema.safeParse(minimalData);
      expect(result.success).toBe(false);
    });
  });

  describe('staySearchSchema', () => {
    it('should validate correct stay search data', () => {
      const validData = {
        destination: 'Abidjan',
        checkIn: '2099-12-01',
        checkOut: '2099-12-05',
        guests: 2,
        propertyType: 'villa' as const
      };

      const result = staySearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject too many guests', () => {
      const invalidData = {
        destination: 'Abidjan',
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
        guests: 25
      };

      const result = staySearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
