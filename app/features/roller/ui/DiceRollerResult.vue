<script setup lang="ts">
  import { computed } from 'vue';
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const { result, details } = useDiceRollerState();

  const isError = computed(() => result.value.startsWith('Ошибка:'));

  const description = computed(() => {
    if (!result.value) return '';

    return isError.value
      ? result.value.replace(/^Ошибка:\s*/i, '')
      : result.value;
  });
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="isError"
      class="rounded-2xl border border-[var(--ui-color-error-500)] px-4 py-3 text-sm text-[var(--ui-color-error-500)]"
      :style="{
        background:
          'color-mix(in srgb, var(--ui-color-error-500) 8%, var(--ui-bg-elevated))',
      }"
    >
      {{ description }}
    </div>

    <div
      v-else-if="details.length"
      class="flex max-h-56 flex-col gap-3 overflow-y-auto pr-1"
    >
      <div
        v-for="detail in details"
        :key="detail.id"
        class="rounded-2xl border border-[var(--ui-border)] px-3 py-3"
        :style="{
          background:
            'color-mix(in srgb, var(--ui-bg-elevated) 85%, transparent)',
        }"
      >
        <div
          class="mb-2 flex items-center justify-between text-sm font-semibold text-[var(--ui-text)]"
        >
          <span>{{ detail.label }}</span>

          <span class="text-[var(--ui-text-highlighted)]">
            {{ detail.total.toLocaleString('ru-RU') }}
          </span>
        </div>

        <ul class="flex flex-wrap gap-2">
          <li
            v-for="roll in detail.rolls"
            :key="roll.id"
            :class="[
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold',
              roll.valid
                ? 'border-[color:color-mix(in_srgb,var(--ui-color-primary-500)_40%,transparent)] text-[var(--ui-text-highlighted)]'
                : 'border-[var(--ui-border)] line-through opacity-60',
            ]"
            :style="{ background: 'var(--ui-bg-elevated)' }"
          >
            <span>{{ roll.value }}</span>

            <UBadge
              v-if="roll.critical === 'success' || roll.critical === 'failure'"
              :color="roll.critical === 'success' ? 'success' : 'error'"
              variant="subtle"
              size="xs"
            >
              {{ roll.critical === 'success' ? 'крит' : 'фейл' }}
            </UBadge>
          </li>
        </ul>
      </div>
    </div>

    <div
      v-else
      class="flex min-h-[112px] items-center rounded-2xl border border-dashed border-[var(--ui-border)] px-4 py-3 text-sm text-[var(--ui-text-muted)]"
      :style="{
        background:
          'linear-gradient(135deg, var(--ui-bg) 0%, var(--ui-bg-elevated) 100%)',
      }"
    >
      Введите формулу и нажмите кнопку справа или клавишу Enter.
    </div>
  </div>
</template>
