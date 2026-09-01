import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCreateBooking } from './useCreateBooking';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useCreateBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a booking successfully', async () => {
    const mockSession = { data: { session: { user: { id: 'user-123' } } } };
    (supabase.auth.getSession as any).mockResolvedValue(mockSession);
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { success: true, booking_id: 'booking-123' },
      error: null,
    });

    const { result } = renderHook(() => useCreateBooking());

    const bookingParams = {
      service_type: 'flight',
      service_name: 'Test Flight',
      location: 'Paris-Abidjan',
      start_date: '2025-12-25',
      guests: 2,
      total_price: 850000,
      currency: 'XOF',
      customer_name: 'Jean Dupont',
      customer_email: 'jean@example.com',
      customer_phone: '+2250707070707',
      passengers: [{ first_name: 'Jean', last_name: 'Dupont' }],
    };

    let bookingId: string | null = null;
    await act(async () => {
      bookingId = await result.current.createBooking(bookingParams);
    });

    await waitFor(() => {
      expect(bookingId).toBe('booking-123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-booking', {
        body: bookingParams,
      });
    });
  });

  it('should return null if user is not authenticated', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useCreateBooking());

    const bookingParams = {
      service_type: 'flight',
      service_name: 'Test Flight',
      location: 'Paris-Abidjan',
      start_date: '2025-12-25',
      guests: 2,
      total_price: 850000,
      currency: 'XOF',
      customer_name: 'Jean Dupont',
      customer_email: 'jean@example.com',
      customer_phone: '+2250707070707',
      passengers: [{ first_name: 'Jean', last_name: 'Dupont' }],
    };

    const bookingId = await result.current.createBooking(bookingParams);

    await waitFor(() => {
      expect(bookingId).toBeNull();
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });
  });

  it('should handle booking creation errors', async () => {
    const mockSession = { data: { session: { user: { id: 'user-123' } } } };
    (supabase.auth.getSession as any).mockResolvedValue(mockSession);
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { success: false, error: 'Booking failed' },
      error: null,
    });

    const { result } = renderHook(() => useCreateBooking());

    const bookingParams = {
      service_type: 'flight',
      service_name: 'Test Flight',
      location: 'Paris-Abidjan',
      start_date: '2025-12-25',
      guests: 2,
      total_price: 850000,
      currency: 'XOF',
      customer_name: 'Jean Dupont',
      customer_email: 'jean@example.com',
      customer_phone: '+2250707070707',
      passengers: [{ first_name: 'Jean', last_name: 'Dupont' }],
    };

    const bookingId = await result.current.createBooking(bookingParams);

    await waitFor(() => {
      expect(bookingId).toBeNull();
    });
  });

  it('should set loading state during booking creation', async () => {
    const mockSession = { data: { session: { user: { id: 'user-123' } } } };
    (supabase.auth.getSession as any).mockResolvedValue(mockSession);
    (supabase.functions.invoke as any).mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({ data: { success: true, booking_id: 'booking-123' }, error: null }), 100)
      )
    );

    const { result } = renderHook(() => useCreateBooking());

    const bookingParams = {
      service_type: 'flight',
      service_name: 'Test Flight',
      location: 'Paris-Abidjan',
      start_date: '2025-12-25',
      guests: 2,
      total_price: 850000,
      currency: 'XOF',
      customer_name: 'Jean Dupont',
      customer_email: 'jean@example.com',
      customer_phone: '+2250707070707',
      passengers: [{ first_name: 'Jean', last_name: 'Dupont' }],
    };

    expect(result.current.loading).toBe(false);

    let promise: Promise<string | null>;
    act(() => {
      promise = result.current.createBooking(bookingParams);
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => { await promise!; });
    expect(result.current.loading).toBe(false);
  });
});
