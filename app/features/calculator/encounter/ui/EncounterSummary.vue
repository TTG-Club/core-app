<script setup lang="ts">
  import type { EncounterResult } from '../model';

  import {
    DIFFICULTY_COLOR,
    DIFFICULTY_HINT,
    DIFFICULTY_LABEL,
    formatExperience,
  } from '../model';
  import EncounterBudgetBar from './EncounterBudgetBar.vue';

  const { result } = defineProps<{
    result: EncounterResult;
  }>();

  const difficultyLabel = computed(() => DIFFICULTY_LABEL[result.difficulty]);
  const difficultyColor = computed(() => DIFFICULTY_COLOR[result.difficulty]);
  const difficultyHint = computed(() => DIFFICULTY_HINT[result.difficulty]);

  const totalExperienceText = computed(() =>
    formatExperience(result.totalExperience),
  );

  const perCharacterText = computed(() =>
    formatExperience(result.experiencePerCharacter),
  );
</script>

<template>
  <section
    class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
    aria-live="polite"
  >
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-sm font-semibold text-highlighted">Сложность</span>

      <UBadge
        :color="difficultyColor"
        variant="subtle"
        size="lg"
      >
        {{ difficultyLabel }}
      </UBadge>

      <div class="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span class="text-muted">
          Опыт существ:
          <span class="font-semibold text-highlighted tabular-nums">
            {{ totalExperienceText }}
          </span>
        </span>

        <span
          v-if="result.characterCount > 0"
          class="text-muted"
        >
          На персонажа:
          <span class="font-semibold text-highlighted tabular-nums">
            {{ perCharacterText }}
          </span>
        </span>
      </div>
    </div>

    <EncounterBudgetBar
      :total-experience="result.totalExperience"
      :budget="result.budget"
    />

    <p class="text-sm text-secondary">
      {{ difficultyHint }}
    </p>
  </section>
</template>
