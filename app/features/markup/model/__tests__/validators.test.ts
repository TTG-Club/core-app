import { describe, expect, it } from 'vitest';

import { validateColor, validateSize, validateVariant } from '../validators';

describe('tipTap Validators', () => {
  describe('validateColor', () => {
    it('returns exact match', () => {
      expect(validateColor('primary')).toBe('primary');
      expect(validateColor('warning')).toBe('warning');
    });

    it('returns default on invalid value', () => {
      expect(validateColor('non-existent')).toBe('neutral');
      expect(validateColor(null)).toBe('neutral');
      expect(validateColor(undefined)).toBe('neutral');
      expect(validateColor(123)).toBe('neutral');
    });

    it('returns custom fallback on invalid value', () => {
      expect(validateColor('non-existent', 'error')).toBe('error');
    });
  });

  describe('validateVariant', () => {
    it('returns exact match', () => {
      expect(validateVariant('solid')).toBe('solid');
      expect(validateVariant('outline')).toBe('outline');
    });

    it('returns default on invalid value', () => {
      expect(validateVariant('non-existent')).toBe('soft');
      expect(validateVariant(null)).toBe('soft');
      expect(validateVariant(undefined)).toBe('soft');
      expect(validateVariant(123)).toBe('soft');
    });

    it('returns custom fallback on invalid value', () => {
      expect(validateVariant('non-existent', 'subtle')).toBe('subtle');
    });
  });

  describe('validateSize', () => {
    it('returns exact match', () => {
      expect(validateSize('sm')).toBe('sm');
      expect(validateSize('lg')).toBe('lg');
    });

    it('returns default on invalid value', () => {
      expect(validateSize('non-existent')).toBe('md');
      expect(validateSize(null)).toBe('md');
      expect(validateSize(undefined)).toBe('md');
      expect(validateSize(123)).toBe('md');
    });

    it('returns custom fallback on invalid value', () => {
      expect(validateSize('non-existent', 'sm')).toBe('sm');
    });
  });
});
