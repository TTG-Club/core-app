<script setup lang="ts">
  import { InfoTooltip } from '~ui/tooltip';

  /**
   * Визуально выделенный блок вкладки «Характеристики» — как секции формы
   * вида в системе D&D: значок, заголовок с подсказкой по наведению и тело.
   */
  const {
    title,
    icon,
    hint = undefined,
  } = defineProps<{
    title: string;
    icon: string;
    hint?: string;
  }>();
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/20 p-4"
  >
    <header
      class="flex items-center gap-2 text-sm font-medium text-highlighted"
    >
      <UIcon
        :name="icon"
        class="size-4 shrink-0 text-primary"
      />

      <InfoTooltip
        v-if="hint"
        :text="hint"
        icon="tabler:info-circle-filled"
      >
        <span>{{ title }}</span>
      </InfoTooltip>

      <span v-else>{{ title }}</span>
    </header>

    <slot />
  </section>
</template>
