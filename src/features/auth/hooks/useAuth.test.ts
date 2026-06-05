import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sign up successfully', async () => {
    (supabase.auth.signUp as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    const signUpResult = await result.current.signUp(
      'test@example.com',
      'password123',
      'Test User'
    );

    await waitFor(() => {
      expect(signUpResult.success).toBe(true);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'Test User' },
          emailRedirectTo: expect.stringContaining('/'),
        },
      });
    });
  });

  it('should handle sign up errors', async () => {
    (supabase.auth.signUp as any).mockResolvedValue({
      error: { message: 'Email already exists' },
    });

    const { result } = renderHook(() => useAuth());

    const signUpResult = await result.current.signUp(
      'test@example.com',
      'password123',
      'Test User'
    );

    await waitFor(() => {
      expect(signUpResult.success).toBe(false);
      expect(signUpResult.error).toBeDefined();
    });
  });

  it('should sign in successfully', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    const signInResult = await result.current.signIn(
      'test@example.com',
      'password123'
    );

    await waitFor(() => {
      expect(signInResult.success).toBe(true);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should handle sign in errors', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => useAuth());

    const signInResult = await result.current.signIn(
      'test@example.com',
      'wrongpassword'
    );

    await waitFor(() => {
      expect(signInResult.success).toBe(false);
      expect(signInResult.error).toBeDefined();
    });
  });

  it('should reset password successfully', async () => {
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    const resetResult = await result.current.resetPassword('test@example.com');

    await waitFor(() => {
      expect(resetResult.success).toBe(true);
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: expect.stringContaining('/auth') }
      );
    });
  });

  it('should handle reset password errors', async () => {
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
      error: { message: 'User not found' },
    });

    const { result } = renderHook(() => useAuth());

    const resetResult = await result.current.resetPassword('nonexistent@example.com');

    await waitFor(() => {
      expect(resetResult.success).toBe(false);
      expect(resetResult.error).toBeDefined();
    });
  });

  it('should update password successfully', async () => {
    (supabase.auth.updateUser as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    const updateResult = await result.current.updatePassword(
      'newpassword123',
      'newpassword123'
    );

    await waitFor(() => {
      expect(updateResult.success).toBe(true);
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });
  });

  it('should reject password update if passwords do not match', async () => {
    const { result } = renderHook(() => useAuth());

    const updateResult = await result.current.updatePassword(
      'newpassword123',
      'differentpassword'
    );

    await waitFor(() => {
      expect(updateResult.success).toBe(false);
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  it('should reject password update if password is too short', async () => {
    const { result } = renderHook(() => useAuth());

    const updateResult = await result.current.updatePassword('12345', '12345');

    await waitFor(() => {
      expect(updateResult.success).toBe(false);
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  it('should handle update password errors', async () => {
    (supabase.auth.updateUser as any).mockResolvedValue({
      error: { message: 'Password too weak' },
    });

    const { result } = renderHook(() => useAuth());

    const updateResult = await result.current.updatePassword(
      'newpassword123',
      'newpassword123'
    );

    await waitFor(() => {
      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toBeDefined();
    });
  });

  it('should sign out successfully', async () => {
    (supabase.auth.signOut as any).mockResolvedValue({});

    const { result } = renderHook(() => useAuth());

    await result.current.signOut();

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('should set loading state during operations', async () => {
    let resolveSignIn: (value: any) => void;
    (supabase.auth.signInWithPassword as any).mockImplementation(
      () => new Promise(resolve => {
        resolveSignIn = resolve;
      })
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);

    const promise = result.current.signIn('test@example.com', 'password123');
    expect(result.current.loading).toBe(true);

    resolveSignIn!({ error: null });
    await promise;
    expect(result.current.loading).toBe(false);
  });
});
