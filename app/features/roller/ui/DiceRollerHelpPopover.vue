<script setup lang="ts">
  import { useDiceRollerState } from '~/features/roller/composables/useDiceRollerState';

  import { consts } from '../const';

  const { basic, keep, reroll } = consts();
  const { formula } = useDiceRollerState();

  function apply(value: string) {
    formula.value = value;
  }
</script>

<template>
  <UPopover>
    <UButton
      icon="i-fluent-info-24-regular"
      variant="ghost"
      color="neutral"
      class="rounded-md text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
      aria-label="Как пользоваться роллером"
    />

    <template #content>
      <div
        class="max-h-[400px] w-[calc(100vw-32px)] space-y-3 overflow-y-auto p-2 sm:w-[360px]"
      >
        <!-- Section: Basic -->
        <div class="space-y-2">
          <p class="text-sm font-semibold text-[var(--ui-text)]">
            Базовые броски
          </p>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in basic"
              :key="item.formula"
              type="button"
              class="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-2 text-left transition hover:border-[var(--ui-border-hovered)] hover:bg-[var(--ui-bg-accented)]"
              @click="apply(item.formula)"
            >
              <span class="text-sm font-bold text-[var(--color-primary-500)]">
                {{ item.formula }}
              </span>

              <span class="text-xs text-[var(--ui-text-muted)]">
                {{ item.note }}
              </span>
            </button>
          </div>
        </div>

        <!-- Section: Keep/Drop -->
        <div class="space-y-2">
          <p class="text-sm font-semibold text-[var(--ui-text)]">
            Лучшие / худшие
          </p>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in keep"
              :key="item.formula"
              type="button"
              class="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-2 text-left transition hover:border-[var(--ui-border-hovered)] hover:bg-[var(--ui-bg-accented)]"
              @click="apply(item.formula)"
            >
              <span class="text-sm font-bold text-[var(--color-primary-500)]">
                {{ item.formula }}
              </span>

              <span class="text-xs text-[var(--ui-text-muted)]">
                — {{ item.note }}
              </span>
            </button>
          </div>
        </div>

        <!-- Section: Reroll -->
        <div class="space-y-2">
          <p class="text-sm font-semibold text-[var(--ui-text)]">Перебросы</p>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in reroll"
              :key="item.formula"
              type="button"
              class="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-2 text-left transition hover:border-[var(--ui-border-hovered)] hover:bg-[var(--ui-bg-accented)]"
              @click="apply(item.formula)"
            >
              <span class="text-sm font-bold text-[var(--color-primary-500)]">
                {{ item.formula }}
              </span>

              <span class="text-xs text-[var(--ui-text-muted)]">
                — {{ item.note }}
              </span>
            </button>
          </div>
        </div>

        <div class="border-t border-[var(--ui-border)] pt-2">
          <p class="text-xs leading-tight text-[var(--ui-text-muted)]">
            Поддерживаются: к, кс, вх/вл, ул/ух, пр/пб, !/!!/!п, с, п, св/су
          </p>
        </div>
      </div>
    </template>
  </UPopover>
</template>
