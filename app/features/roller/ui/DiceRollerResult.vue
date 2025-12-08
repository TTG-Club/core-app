<script setup lang="ts">
  import { computed } from 'vue';

  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const state = useDiceRollerState();

  const hasDetails = computed(() => state.details.value.length > 0);

  const isError = computed(
    () =>
      typeof state.result.value === 'string' &&
      state.result.value.startsWith('Ошибка:'),
  );

  const errorText = computed(() =>
    isError.value ? String(state.result.value).replace(/^Ошибка:\s*/i, '') : '',
  );
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
      {{ errorText }}
    </div>

    <Transition
      v-else
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
      mode="out-in"
    >
      <div
        :key="`result-${state.resultKey.value}`"
        class="flex max-h-56 flex-col gap-3 overflow-y-auto pr-1"
      >
        <div
          v-if="hasDetails"
          class="flex flex-col gap-3"
        >
          <div
            v-for="detail in state.details.value"
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
                {{
                  typeof detail.total === 'number'
                    ? detail.total.toLocaleString('ru-RU')
                    : detail.total
                }}
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
          Введите формулу и нажмите кнопку справа или Enter.
        </div>
      </div>
    </Transition>
  </div>
</template>
