<script setup lang="ts">
  import type { AbilityScores, BonusSource } from '~calculator/abilities';

  import { CalculatorAbilityScores } from '~calculator/abilities';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_ORDER,
    ABILITY_SCORES_LABELS,
    ABILITY_SHORT_LABELS,
    API_ABILITY_KEYS,
    getScoresAbilities,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setAbilityScores } = useCharacterSheet();

  // Набор из калькулятора приходит наверх как есть; пока в нём есть нули,
  // характеристика не назначена — записывать такой набор нечестно.
  const draftScores = ref<AbilityScores | null>(null);

  const backgroundBonuses = computed(
    () => character.value.characterBackground?.abilityBonuses ?? {},
  );

  // Прибавки предыстории уже сидят внутри значений листа, поэтому набор
  // складывается с ними — иначе выбранная предыстория молча пропадала бы из
  // характеристик. Калькулятору они уходят обычным источником бонусов: так они
  // видны и в сводке, и в разборе значения.
  const bonusSources = computed<BonusSource[]>(() => {
    const background = character.value.characterBackground;

    if (!background) {
      return [];
    }

    const scores: Partial<AbilityScores> = {};

    for (const key of ABILITY_ORDER) {
      const bonus = backgroundBonuses.value[key] ?? 0;

      if (bonus !== 0) {
        scores[API_ABILITY_KEYS[key]] = bonus;
      }
    }

    if (Object.keys(scores).length === 0) {
      return [];
    }

    return [
      {
        id: `background-${background.url}`,
        label: `${ABILITY_SCORES_LABELS.backgroundBonusPrefix}: ${background.name}`,
        type: 'background',
        scores,
      },
    ];
  });

  const hasBackgroundBonuses = computed(() => bonusSources.value.length > 0);

  const currentScores = computed(() =>
    ABILITY_ORDER.map((key) => ({
      key,
      label: ABILITY_SHORT_LABELS[key],
      score: character.value.abilities[key],
    })),
  );

  const isIncomplete = computed(
    () =>
      !draftScores.value
      || ABILITY_ORDER.some(
        (key) => (draftScores.value?.[API_ABILITY_KEYS[key]] ?? 0) <= 0,
      ),
  );

  function handleScoresUpdate(scores: AbilityScores) {
    draftScores.value = scores;
  }

  function handleApply() {
    if (!draftScores.value || isIncomplete.value) {
      return;
    }

    setAbilityScores(
      getScoresAbilities(
        character.value.abilities,
        draftScores.value,
        backgroundBonuses.value,
      ),
    );

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="ABILITY_SCORES_LABELS.title"
    :description="ABILITY_SCORES_LABELS.description"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span class="text-dimmed">{{ ABILITY_SCORES_LABELS.current }}:</span>

          <span
            v-for="ability in currentScores"
            :key="ability.key"
            class="text-toned"
          >
            {{ ability.label }}
            <span class="font-bold text-highlighted">{{ ability.score }}</span>
          </span>
        </div>

        <CalculatorAbilityScores
          :bonuses="bonusSources"
          @update:scores="handleScoresUpdate"
        />

        <p
          v-if="hasBackgroundBonuses"
          class="text-xs text-dimmed"
        >
          {{ ABILITY_SCORES_LABELS.backgroundHint }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <span
          v-if="isIncomplete"
          class="mr-auto text-xs text-dimmed"
        >
          {{ ABILITY_SCORES_LABELS.incompleteHint }}
        </span>

        <UButton
          :label="ABILITY_SCORES_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ABILITY_SCORES_LABELS.apply"
          color="primary"
          :disabled="isIncomplete"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
