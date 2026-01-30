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
  <UPopover
    :ui="{
      content:
        'overflow-hidden bg-muted max-h-100 w-full max-w-sm gap-4 overflow-y-auto p-4',
    }"
  >
    <UButton
      icon="i-ttg-info"
      color="neutral"
      variant="subtle"
      aria-label="Как пользоваться роллером"
    />

    <template #content>
      <div
        v-for="section in sections"
        :key="section.title"
        class="grid gap-2"
      >
        <p class="text-sm font-semibold text-default">
          {{ section.title }}
        </p>

        <div class="grid grid-cols-2 gap-2">
          <UButton
            v-for="example in section.examples"
            :key="example.formula"
            class="not-last:not-first:rounded-md not-only:first:rounded-e-md not-only:last:rounded-s-md"
            variant="subtle"
            color="neutral"
            size="xl"
            @click.left.exact.prevent="applyFormula(example.formula)"
          >
            <span class="flex flex-col items-start gap-0.5">
              <span class="text-sm font-bold">
                {{ example.formula }}
              </span>

              <span class="text-xs text-dimmed">
                {{ example.note }}
              </span>
            </span>
          </UButton>
        </div>
      </div>

      <div class="border-t border-default pt-2">
        <p class="text-xs leading-tight text-muted">
          Поддерживаются: к, кс, вх/вл, ул/ух, пр/пб, !/!!/!п, с, п, св/су
        </p>
      </div>
    </template>
  </UPopover>
</template>
