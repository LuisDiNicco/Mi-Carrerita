import { describe, it, expect, beforeEach } from 'vitest';
import { setAccessToken, getAccessToken, clearAccessToken } from './auth';

describe('auth token helpers', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it('getAccessToken returns null initially', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('setAccessToken stores a token', () => {
    setAccessToken('my-token-123');
    expect(getAccessToken()).toBe('my-token-123');
  });

  it('clearAccessToken resets to null', () => {
    setAccessToken('some-token');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('setAccessToken(null) clears the token', () => {
    setAccessToken('token');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('overwrites a previous token on setAccessToken', () => {
    setAccessToken('first');
    setAccessToken('second');
    expect(getAccessToken()).toBe('second');
  });
});
