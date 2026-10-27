<script setup lang="ts">
  import {
    ADMIN_DASHBOARD_HINT_ICON,
    ADMIN_DASHBOARD_TOOLTIP_UI,
  } from '../model';

  defineProps<{
    title: string;
    /** Значок перед заголовком: у панелей-групп разделов */
    icon?: string;
    /** Пояснение к панели: прячется за значком у заголовка */
    hint?: string;
  }>();

  defineSlots<{
    default: () => unknown;
    /** Правая часть шапки: бейджи, итог, переключатели */
    meta?: () => unknown;
  }>();
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{
      root: 'flex flex-col',
      header:
        'flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-4',
      body: 'flex-1 p-0 sm:p-0',
    }"
  >
    <template #header>
      <div class="flex items-center gap-1.5">
        <UIcon
          v-if="icon"
          :name="icon"
          class="size-4 text-primary"
        />

        <h3 class="text-sm font-semibold text-highlighted">{{ title }}</h3>

        <UTooltip
          v-if="hint"
          :text="hint"
          :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
        >
          <UIcon
            :name="ADMIN_DASHBOARD_HINT_ICON"
            class="size-4 text-dimmed"
          />
        </UTooltip>
      </div>

      <div
        v-if="$slots.meta"
        class="ml-auto flex items-center gap-2 text-xs text-muted"
      >
        <slot name="meta" />
      </div>
    </template>

    <slot />
  </UCard>
</template>
