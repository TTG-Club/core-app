<script setup lang="ts">
  import { ABILITY_LABELS, AbilityKey } from '~/shared/types';

  import type {
    AbilityScores,
    BonusSource,
    CalculatorAbilitiesBackground,
  } from '../model';

  const props = defineProps<{
    background: CalculatorAbilitiesBackground | undefined;
  }>();

  const emit = defineEmits<{
    (e: 'update:sources', value: BonusSource[]): void;
  }>();

  const asiChoice = ref<'three_ones' | 'two_one'>('two_one');
  const plusTwoStat = ref<AbilityKey | undefined>(undefined);
  const plusOneStat = ref<AbilityKey | undefined>(undefined);

  // Parse abilities from background
  const availableAbilities = computed<AbilityKey[]>(() => {
    const bg = props.background;

    if (!bg?.abilityScores || !Array.isArray(bg.abilityScores)) {
      return [];
    }

    return bg.abilityScores
      .map((name: string) => {
        return Object.values(AbilityKey).find((k) => k === name.toUpperCase());
      })
      .filter((k: AbilityKey | undefined): k is AbilityKey => !!k);
  });

  // Determine allowed choices
  const canChooseThreeOnes = computed(
    () => availableAbilities.value.length >= 3,
  );

  const canChooseTwoOne = computed(() => availableAbilities.value.length >= 2);

  // Reset choices when background changes
  watch(
    () => props.background,
    () => {
      plusTwoStat.value = undefined;
      plusOneStat.value = undefined;

      // Default to +2/+1 if possible, otherwise +1/+1/+1
      if (canChooseTwoOne.value) {
        asiChoice.value = 'two_one';
      } else if (canChooseThreeOnes.value) {
        asiChoice.value = 'three_ones';
      }
    },
  );

  const calculatedBonuses = computed<BonusSource[]>(() => {
    if (!props.background) {
      return [];
    }

    const bonuses: Partial<AbilityScores> = {};
    const bgName = props.background.name.rus;

    if (asiChoice.value === 'three_ones' && canChooseThreeOnes.value) {
      // Apply +1 to first 3 abilities
      for (const key of availableAbilities.value.slice(0, 3)) {
        bonuses[key] = (bonuses[key] || 0) + 1;
      }
    } else if (asiChoice.value === 'two_one' && canChooseTwoOne.value) {
      if (plusTwoStat.value) {
        bonuses[plusTwoStat.value] = (bonuses[plusTwoStat.value] || 0) + 2;
      }

      if (plusOneStat.value) {
        bonuses[plusOneStat.value] = (bonuses[plusOneStat.value] || 0) + 1;
      }
    }

    // If no bonuses selected yet, return empty but with label
    return [
      {
        id: props.background.url,
        label: `Предыстория: ${bgName}`,
        scores: bonuses,
      },
    ];
  });

  watch(calculatedBonuses, (newVal) => {
    emit('update:sources', newVal);
  });

  const availableForPlusTwo = computed(() => availableAbilities.value);

  const availableForPlusOne = computed(() => availableAbilities.value);

  watch(plusTwoStat, (val) => {
    if (val && val === plusOneStat.value) {
      plusOneStat.value = undefined;
    }
  });

  watch(plusOneStat, (val) => {
    if (val && val === plusTwoStat.value) {
      plusTwoStat.value = undefined;
    }
  });

  const asiOptions = computed(() => {
    const options = [];

    if (canChooseTwoOne.value) {
      options.push({ label: '+2 / +1', value: 'two_one' });
    }

    if (canChooseThreeOnes.value) {
      options.push({ label: '+1 / +1 / +1', value: 'three_ones' });
    }

    return options;
  });

  const plusTwoOptions = computed(() =>
    availableForPlusTwo.value.map((k) => ({
      label: `${ABILITY_LABELS[k]} (+2)`,
      value: k,
    })),
  );

  const plusOneOptions = computed(() =>
    availableForPlusOne.value.map((k) => ({
      label: `${ABILITY_LABELS[k]} (+1)`,
      value: k,
    })),
  );

  function getAutomaticBonusDescription(abilities: AbilityKey[]): string {
    return abilities.map((k) => `${ABILITY_LABELS[k]} (+1)`).join(', ');
  }
</script>

<template>
  <div
    class="flex flex-col gap-4"
    :class="{ 'pointer-events-none opacity-50 grayscale': !background }"
  >
    <div class="text-sm font-semibold">Бонусы предыстории</div>

    <div
      v-if="background"
      class="flex flex-col gap-3"
    >
      <div class="flex flex-col gap-2">
        <span class="text-xs font-medium text-secondary">
          Бонусы характеристик:
        </span>

        <div class="flex gap-4">
          <URadioGroup
            v-if="canChooseTwoOne || canChooseThreeOnes"
            v-model="asiChoice"
            orientation="horizontal"
            :items="asiOptions"
          />
        </div>
      </div>

      <div
        v-if="asiChoice === 'two_one'"
        class="grid grid-cols-2 gap-2"
      >
        <UFieldGroup class="w-full">
          <USelect
            v-model="plusTwoStat"
            :items="plusTwoOptions"
            placeholder="Выберите +2"
            class="w-full"
          />

          <UButton
            v-if="plusTwoStat"
            icon="i-fluent-dismiss-24-regular"
            color="neutral"
            variant="subtle"
            @click="plusTwoStat = undefined"
          />
        </UFieldGroup>

        <UFieldGroup class="w-full">
          <USelect
            v-model="plusOneStat"
            :items="plusOneOptions"
            placeholder="Выберите +1"
            class="w-full"
          />

          <UButton
            v-if="plusOneStat"
            icon="i-fluent-dismiss-24-regular"
            color="neutral"
            variant="subtle"
            @click="plusOneStat = undefined"
          />
        </UFieldGroup>
      </div>

      <div
        v-else
        class="text-xs text-secondary"
      >
        Автоматически:
        {{ getAutomaticBonusDescription(availableAbilities) }}
      </div>
    </div>

    <div
      v-else
      class="text-sm text-secondary"
    >
      Выберите предысторию выше, чтобы настроить бонусы.
    </div>
  </div>
</template>
