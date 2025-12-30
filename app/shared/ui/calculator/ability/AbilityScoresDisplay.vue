<script setup lang="ts">
  import { computed } from 'vue';

  import { AbilityKey, type BaseAbilityScores } from '~/shared/types';

  type AbilityCard = {
    key: AbilityKey;
    label: string;
  };

  type EpicBoonAbilities = Partial<Record<AbilityKey, boolean>>;

  const {
    baseScores,
    finalScores,
    bonusScores,
    epicBoonAbilities = {},
  } = defineProps<{
    baseScores: BaseAbilityScores;
    finalScores: BaseAbilityScores;
    bonusScores: BaseAbilityScores;
    epicBoonAbilities?: EpicBoonAbilities;
  }>();

  const abilityCards: Array<AbilityCard> = [
    { key: AbilityKey.STRENGTH, label: 'СИЛ' },
    { key: AbilityKey.DEXTERITY, label: 'ЛОВ' },
    { key: AbilityKey.CONSTITUTION, label: 'ТЕЛ' },
    { key: AbilityKey.INTELLIGENCE, label: 'ИНТ' },
    { key: AbilityKey.WISDOM, label: 'МДР' },
    { key: AbilityKey.CHARISMA, label: 'ХАР' },
  ];

  const abilityModifier = (value: number): number => {
    return Math.floor((value - 10) / 2);
  };

  const formatModifier = (value: number): string => {
    const modifier = abilityModifier(value);

    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const totalBaseScore = computed<number>(() => {
    return (
      baseScores[AbilityKey.STRENGTH] +
      baseScores[AbilityKey.DEXTERITY] +
      baseScores[AbilityKey.CONSTITUTION] +
      baseScores[AbilityKey.INTELLIGENCE] +
      baseScores[AbilityKey.WISDOM] +
      baseScores[AbilityKey.CHARISMA]
    );
  });

  const totalFinalScore = computed<number>(() => {
    return (
      finalScores[AbilityKey.STRENGTH] +
      finalScores[AbilityKey.DEXTERITY] +
      finalScores[AbilityKey.CONSTITUTION] +
      finalScores[AbilityKey.INTELLIGENCE] +
      finalScores[AbilityKey.WISDOM] +
      finalScores[AbilityKey.CHARISMA]
    );
  });

  const isNonZeroBonus = (abilityKey: AbilityKey): boolean => {
    return bonusScores[abilityKey] !== 0;
  };

  const isEpicBoonAbility = (abilityKey: AbilityKey): boolean => {
    return epicBoonAbilities[abilityKey] === true;
  };

  const isOvercap = (abilityKey: AbilityKey): boolean => {
    const finalValue = finalScores[abilityKey];

    if (isEpicBoonAbility(abilityKey)) {
      return finalValue > 30;
    }

    return finalValue > 20;
  };

  const getCardClass = (abilityKey: AbilityKey): string => {
    const baseClass = 'rounded-xl p-2 text-center';

    if (!isOvercap(abilityKey)) {
      return `${baseClass} bg-gray-50 dark:bg-gray-900`;
    }

    return `${baseClass} bg-red-50 ring-1 ring-red-200 dark:bg-red-950/30 dark:ring-red-900`;
  };
</script>

<template>
  <div class="space-y-3">
    <div class="text-sm font-semibold">Характеристики</div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="abilityCard in abilityCards"
        :key="abilityCard.key"
        :class="getCardClass(abilityCard.key)"
      >
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ abilityCard.label }}
        </div>

        <div class="text-lg font-semibold">
          {{ finalScores[abilityCard.key] }}
          <span class="text-sm text-gray-500 dark:text-gray-400">
            ({{ formatModifier(finalScores[abilityCard.key]) }})
          </span>
        </div>

        <div
          v-if="isNonZeroBonus(abilityCard.key)"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          ({{ baseScores[abilityCard.key] }} +
          {{ bonusScores[abilityCard.key] }})
        </div>
      </div>
    </div>

    <div
      class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200"
    >
      Сумма базовых характеристик:
      <span class="font-semibold">{{ totalBaseScore }}</span>

      <span class="text-gray-500 dark:text-gray-400"> • </span>
      С учётом бонусов:
      <span class="font-semibold">{{ totalFinalScore }}</span>
    </div>
  </div>
</template>
