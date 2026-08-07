<script setup lang="ts">
  import type { AdminOnlineSiteCardRow } from '../model';

  const props = defineProps<{
    isPending: boolean;
    row: AdminOnlineSiteCardRow;
  }>();

  // Линия отделяет итог от строк-подмножеств: у приложения итог стоит первым, у сайтов —
  // последним, поэтому сторона приходит из модели, а не выводится из порядка строк.
  const dividerClass = computed(() => {
    if (props.row.divider === 'above') {
      return 'border-t border-default pt-3';
    }

    return props.row.divider === 'below' ? 'border-b border-default pb-3' : '';
  });

  const labelClass = computed(() =>
    props.row.isTotal ? 'font-medium text-default' : 'text-muted',
  );

  const valueClass = computed(() =>
    props.row.isTotal
      ? 'text-lg font-semibold text-primary'
      : 'font-medium text-default',
  );

  const skeletonClass = computed(() =>
    props.row.isTotal ? 'h-7 w-12' : 'h-5 w-10',
  );
</script>

<template>
  <div
    class="flex items-center justify-between gap-4"
    :class="dividerClass"
  >
    <dt :class="labelClass">{{ row.label }}</dt>

    <dd :class="valueClass">
      <USkeleton
        v-if="isPending"
        :class="skeletonClass"
      />

      <template v-else>{{ row.value }}</template>
    </dd>
  </div>
</template>
