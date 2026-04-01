const VALID_COLORS = [
  'error',
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'neutral',
] as const;

export type SemanticColor = (typeof VALID_COLORS)[number];

const VALID_VARIANTS = ['solid', 'outline', 'soft', 'subtle'] as const;

export type SemanticVariant = (typeof VALID_VARIANTS)[number];

const VALID_SIZES = ['sm', 'md', 'lg'] as const;

export type SemanticSize = (typeof VALID_SIZES)[number];

export function validateColor(
  value: unknown,
  fallback: SemanticColor = 'neutral',
): SemanticColor {
  if (
    typeof value === 'string'
    && VALID_COLORS.includes(value as SemanticColor)
  ) {
    return value as SemanticColor;
  }

  return fallback;
}

export function validateVariant(
  value: unknown,
  fallback: SemanticVariant = 'soft',
): SemanticVariant {
  if (
    typeof value === 'string'
    && VALID_VARIANTS.includes(value as SemanticVariant)
  ) {
    return value as SemanticVariant;
  }

  return fallback;
}

export function validateSize(
  value: unknown,
  fallback: SemanticSize = 'md',
): SemanticSize {
  if (
    typeof value === 'string'
    && VALID_SIZES.includes(value as SemanticSize)
  ) {
    return value as SemanticSize;
  }

  return fallback;
}
