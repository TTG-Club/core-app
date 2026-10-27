<script setup lang="ts">
  import { ADMIN_DASHBOARD_TOOLTIP_UI } from '../model';

  const props = defineProps<{
    /** Главное число плитки, уже приведённое к строке */
    value: string;
    label: string;
    isPending: boolean;
    /** Короткая пометка рядом с подписью: площадка, к которой относится число */
    badge?: string;
    /** Сообщение вместо расшифровки, когда данные не пришли */
    errorText?: string;
    /** Что за главное число: разворачивается в подсказке при наведении */
    valueHint?: string;
  }>();

  defineSlots<{
    /** Расшифровка под главным числом */
    default?: () => unknown;
  }>();

  const isValueHintDisabled = computed(() => !props.valueHint);
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1 px-4 py-3">
    <div class="flex h-5 items-center gap-1.5 text-xs text-muted">
      <span class="truncate">{{ label }}</span>

      <UBadge
        v-if="badge"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        {{ badge }}
      </UBadge>
    </div>

    <USkeleton
      v-if="isPending"
      class="h-8 w-16"
    />

    <UTooltip
      v-else
      :text="valueHint"
      :disabled="isValueHintDisabled"
      :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
    >
      <span
        class="w-fit text-2xl/8 font-semibold text-highlighted tabular-nums"
      >
        {{ value }}
      </span>
    </UTooltip>

    <p
      v-if="errorText"
      class="text-xs text-error"
      role="status"
    >
      {{ errorText }}
    </p>

    <slot v-else />
  </div>
</template>
