import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 1: Centralized Design System Verification', () => {
  const tokensPath = path.resolve(import.meta.dirname, '../src/styles/tokens.css');
  const tokensContent = fs.readFileSync(tokensPath, 'utf-8');

  it('contains essential color tokens for pharmacy theme', () => {
    expect(tokensContent).toContain('--color-primary:');
    expect(tokensContent).toContain('--color-bg-app:');
    expect(tokensContent).toContain('--color-bg-surface:');
    expect(tokensContent).toContain('--color-text-primary:');
    expect(tokensContent).toContain('--color-star-active:');
    expect(tokensContent).toContain('--color-focus-ring:');
  });

  it('contains strict spacing scale', () => {
    expect(tokensContent).toContain('--space-1:');
    expect(tokensContent).toContain('--space-2:');
    expect(tokensContent).toContain('--space-4:');
    expect(tokensContent).toContain('--space-8:');
    expect(tokensContent).toContain('--space-12:');
    expect(tokensContent).toContain('--min-touch-target: 48px;');
  });

  it('contains standard radius tokens', () => {
    expect(tokensContent).toContain('--radius-sm:');
    expect(tokensContent).toContain('--radius-md:');
    expect(tokensContent).toContain('--radius-lg:');
    expect(tokensContent).toContain('--radius-xl:');
    expect(tokensContent).toContain('--radius-full:');
  });

  it('contains subtle shadow hierarchy', () => {
    expect(tokensContent).toContain('--shadow-subtle:');
    expect(tokensContent).toContain('--shadow-card:');
    expect(tokensContent).toContain('--shadow-medium:');
    expect(tokensContent).toContain('--shadow-modal:');
  });

  it('includes reduced motion accessibility media query', () => {
    expect(tokensContent).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
