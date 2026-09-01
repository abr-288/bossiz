import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveEnvValue } from './appConfig';

describe('resolveEnvValue', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers VITE-prefixed values when both variants are present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://vite.supabase.co');
    vi.stubEnv('REACT_APP_SUPABASE_URL', 'https://legacy.supabase.co');

    expect(resolveEnvValue('VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL')).toBe('https://vite.supabase.co');
  });

  it('falls back to legacy REACT_APP values when VITE values are missing', () => {
    vi.stubEnv('REACT_APP_CINETPAY_API_KEY', 'legacy-key');

    expect(resolveEnvValue('VITE_CINETPAY_API_KEY', 'REACT_APP_CINETPAY_API_KEY')).toBe('legacy-key');
  });

  it('returns an empty string when no matching value exists', () => {
    expect(resolveEnvValue('VITE_MISSING_VALUE', 'REACT_APP_MISSING_VALUE')).toBe('');
  });
});
