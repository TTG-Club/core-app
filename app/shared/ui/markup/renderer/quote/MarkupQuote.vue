<script setup lang="ts">
  import { UCard } from '#components';
  import type { QuoteNode } from '../../types';

  const { node } = defineProps<{
    node: QuoteNode;
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

  const color = validateColor(node.attrs.color);
  const variant = validateVariant(node.attrs.variant);
</script>

<template>
  <UCard
    :color="color"
    :variant="variant"
    class="my-4 border-l-4 p-4"
  >
    <slot />
  </UCard>
</template>
