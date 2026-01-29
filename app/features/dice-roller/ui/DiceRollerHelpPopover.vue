<script setup lang="ts">
  import { useDiceRollerState } from '~dice-roller/composables';
  import {
    DICE_EXAMPLES_BASIC,
    DICE_EXAMPLES_KEEP,
    DICE_EXAMPLES_REROLL,
  } from '~dice-roller/const';

  const { formula } = useDiceRollerState();

  function applyFormula(value: string) {
    formula.value = value;
  }
</script>

<template>
  <UPopover :ui="{ content: 'p-0 overflow-hidden' }">
    <UButton
      icon="i-fluent-info-24-regular"
      color="secondary"
      aria-label="Как пользоваться роллером"
    />

    <template #content>
      <div
        class="max-h-100 w-[calc(100vw-48px)] space-y-4 overflow-y-auto p-4 pr-3 sm:w-90"
      >
        <div class="space-y-2">
          <p class="text-sm font-semibold text-default">Базовые броски</p>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="example in DICE_EXAMPLES_BASIC"
              :key="example.formula"
              variant="outline"
              color="neutral"
              class="h-auto flex-col items-start gap-0.5 p-2"
              @click.left.exact.prevent="applyFormula(example.formula)"
            >
              <span class="text-sm font-bold text-primary">
                {{ example.formula }}
              </span>

              <span class="text-xs text-muted">
                {{ example.note }}
              </span>
            </UButton>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-semibold text-default">Лучшие / худшие</p>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="example in DICE_EXAMPLES_KEEP"
              :key="example.formula"
              variant="outline"
              color="neutral"
              class="h-auto flex-col items-start gap-0.5 p-2"
              @click.left.exact.prevent="applyFormula(example.formula)"
            >
              <span class="text-sm font-bold text-primary">
                {{ example.formula }}
              </span>

              <span class="text-xs text-muted">
                {{ example.note }}
              </span>
            </UButton>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-semibold text-default">Перебросы</p>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="example in DICE_EXAMPLES_REROLL"
              :key="example.formula"
              variant="outline"
              color="neutral"
              class="h-auto flex-col items-start gap-0.5 p-2"
              @click.left.exact.prevent="applyFormula(example.formula)"
            >
              <span class="text-sm font-bold text-primary">
                {{ example.formula }}
              </span>

              <span class="text-xs text-muted">
                {{ example.note }}
              </span>
            </UButton>
          </div>
        </div>

        <div class="border-t border-default pt-2">
          <p class="text-xs leading-tight text-muted">
            Поддерживаются: к, кс, вх/вл, ул/ух, пр/пб, !/!!/!п, с, п, св/су
          </p>
        </div>
      </div>
    </template>
  </UPopover>
</template>
