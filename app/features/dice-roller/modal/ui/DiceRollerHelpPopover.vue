<script setup lang="ts">
  import { useDiceRollerState } from '../../composables';
  import {
    DICE_EXAMPLES_BASIC,
    DICE_EXAMPLES_KEEP,
    DICE_EXAMPLES_REROLL,
  } from '../../const';

  import type { DiceFormulaExample } from '../../types';

  interface HelpSection {
    title: string;
    examples: DiceFormulaExample[];
  }

  const { formula } = useDiceRollerState();

  const sections: HelpSection[] = [
    { title: 'Базовые броски', examples: DICE_EXAMPLES_BASIC },
    { title: 'Лучшие / худшие', examples: DICE_EXAMPLES_KEEP },
    { title: 'Перебросы', examples: DICE_EXAMPLES_REROLL },
  ];

  function applyFormula(value: string) {
    formula.value = value;
  }
</script>

<template>
  <UPopover :ui="{ content: 'p-0 overflow-hidden' }">
    <UButton
      icon="i-fluent-info-24-regular"
      color="neutral"
      variant="subtle"
      aria-label="Как пользоваться роллером"
    />

    <template #content>
      <div
        class="max-h-100 w-full max-w-sm space-y-4 overflow-y-auto bg-muted p-4 pr-3"
      >
        <div
          v-for="section in sections"
          :key="section.title"
          class="space-y-2"
        >
          <p class="text-sm font-semibold text-default">
            {{ section.title }}
          </p>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="example in section.examples"
              :key="example.formula"
              variant="subtle"
              color="neutral"
              class="h-auto w-full flex-col items-start gap-0.5 !rounded-md p-2"
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
