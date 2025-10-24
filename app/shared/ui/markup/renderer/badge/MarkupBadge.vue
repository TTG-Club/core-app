<script setup lang="ts">
  import { UBadge } from '#components';
  import type { BadgeNode } from '../../types';

  const { node } = defineProps<{
    node: BadgeNode;
  }>();

  function validateColor(
    color: string | undefined,
  ):
    | 'error'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'neutral' {
    if (color === 'error') return 'error';
    if (color === 'primary') return 'primary';
    if (color === 'secondary') return 'secondary';
    if (color === 'success') return 'success';
    if (color === 'info') return 'info';
    if (color === 'warning') return 'warning';
    if (color === 'neutral') return 'neutral';

    return 'neutral';
  }

  function validateVariant(
    variant: string | undefined,
  ): 'solid' | 'outline' | 'soft' | 'subtle' {
    if (variant === 'solid') return 'solid';
    if (variant === 'outline') return 'outline';
    if (variant === 'soft') return 'soft';
    if (variant === 'subtle') return 'subtle';

    return 'soft';
  }

  function validateSize(size: string | undefined): 'sm' | 'md' | 'lg' {
    if (size === 'sm') return 'sm';
    if (size === 'md') return 'md';
    if (size === 'lg') return 'lg';

    return 'md';
  }

  const color = validateColor(node.attrs.color);
  const variant = validateVariant(node.attrs.variant);
  const size = validateSize(node.attrs.size);
</script>

<template>
  <UBadge
    :color="color"
    :variant="variant"
    :size="size"
  >
    <slot />
  </UBadge>
</template>
