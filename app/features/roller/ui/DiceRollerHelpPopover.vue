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
      icon="i-fluent-info-16-regular"
      variant="ghost"
      color="neutral"
      size="xs"
      aria-label="Как пользоваться роллером"
    />

    <template #content>
      <div class="w-[360px] space-y-3 p-4">
        <p class="font-semibold">Базовые броски</p>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in basic"
            :key="item.formula"
            type="button"
            class="flex min-w-[110px] flex-1 flex-col gap-1 rounded-md border border-transparent px-2 py-1 text-left transition hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg)]"
            @click="apply(item.formula)"
          >
            <span class="font-semibold text-[var(--ui-text-highlighted)]">
              {{ item.formula }}
            </span>

            <span class="text-xs text-[var(--ui-text-muted)]">
              {{ item.note }}
            </span>
          </button>
        </div>

        <p class="pt-1 font-semibold">Лучшие / худшие</p>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in keep"
            :key="item.formula"
            type="button"
            class="flex min-w-[110px] flex-1 flex-col gap-1 rounded-md border border-transparent px-2 py-1 text-left transition hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg)]"
            @click="apply(item.formula)"
          >
            <span class="font-semibold text-[var(--ui-text-highlighted)]">
              {{ item.formula }}
            </span>

            <span class="text-xs text-[var(--ui-text-muted)]">
              — {{ item.note }}
            </span>
          </button>
        </div>

        <p class="pt-1 font-semibold">Перебросы</p>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in reroll"
            :key="item.formula"
            type="button"
            class="flex min-w-[110px] flex-1 flex-col gap-1 rounded-md border border-transparent px-2 py-1 text-left transition hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg)]"
            @click="apply(item.formula)"
          >
            <span class="font-semibold text-[var(--ui-text-highlighted)]">
              {{ item.formula }}
            </span>

            <span class="text-xs text-[var(--ui-text-muted)]">
              — {{ item.note }}
            </span>
          </button>
        </div>

        <p class="pt-1 text-xs text-[var(--ui-text-muted)]">
          Поддерживаются: к, кс, вх/вл, ул/ух, пр/пб, !/!!/!п, с, п, св/су
        </p>
      </div>
    </template>
  </UPopover>
</template>
