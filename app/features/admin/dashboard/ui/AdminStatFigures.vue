<script setup lang="ts">
  import type { AdminStatFigure } from '../model';

  import { ADMIN_DASHBOARD_TOOLTIP_UI } from '../model';

  const props = defineProps<{
    figures: ReadonlyArray<AdminStatFigure>;
    isPending: boolean;
    /**
     * Второстепенный ряд: доли уже показанного числа, а не отдельные слагаемые, —
     * поэтому приглушённее, чтобы не читался как самостоятельная группа.
     */
    isSecondary?: boolean;
  }>();

  // Подсказка выключается у чисел без пояснения — иначе всплывал бы пустой тултип.
  const figureRows = computed(() =>
    props.figures.map((figure) => ({
      ...figure,
      isHintDisabled: !figure.hint,
    })),
  );

  const labelClass = computed(() =>
    props.isSecondary ? 'text-dimmed' : 'text-muted',
  );

  const valueClass = computed(() =>
    props.isSecondary ? 'text-muted' : 'text-default',
  );
</script>

<template>
  <dl class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
    <UTooltip
      v-for="figure in figureRows"
      :key="figure.label"
      :text="figure.hint"
      :disabled="figure.isHintDisabled"
      :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
    >
      <div class="flex items-baseline gap-1">
        <dt :class="labelClass">{{ figure.label }}</dt>

        <dd
          class="font-medium tabular-nums"
          :class="valueClass"
        >
          <USkeleton
            v-if="isPending"
            class="h-3 w-4"
          />

          <template v-else>{{ figure.value }}</template>
        </dd>
      </div>
    </UTooltip>
  </dl>
</template>
