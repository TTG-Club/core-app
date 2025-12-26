<script setup lang="ts">
  import { computed, ref, watch } from 'vue';

  import FeatPicker from './FeatPicker.vue';
  import BackgroundAbilityBonus from '~ui/calculator/ability/BackgroundAbilityBonus.vue';

  import { AbilityKey } from '~/shared/types';
  import type { BaseAbilityScores } from '~/shared/types';

  const bonus = defineModel<BaseAbilityScores>('bonus', {
    required: true,
  });

  const emptyScores = (): BaseAbilityScores => {
    return {
      [AbilityKey.STRENGTH]: 0,
      [AbilityKey.DEXTERITY]: 0,
      [AbilityKey.CONSTITUTION]: 0,
      [AbilityKey.INTELLIGENCE]: 0,
      [AbilityKey.WISDOM]: 0,
      [AbilityKey.CHARISMA]: 0,
    };
  };

  const sameBaseScores = (
    a: BaseAbilityScores,
    b: BaseAbilityScores,
  ): boolean => {
    return (
      a[AbilityKey.STRENGTH] === b[AbilityKey.STRENGTH] &&
      a[AbilityKey.DEXTERITY] === b[AbilityKey.DEXTERITY] &&
      a[AbilityKey.CONSTITUTION] === b[AbilityKey.CONSTITUTION] &&
      a[AbilityKey.INTELLIGENCE] === b[AbilityKey.INTELLIGENCE] &&
      a[AbilityKey.WISDOM] === b[AbilityKey.WISDOM] &&
      a[AbilityKey.CHARISMA] === b[AbilityKey.CHARISMA]
    );
  };

  const backgroundBonus = ref<BaseAbilityScores>(emptyScores());
  const featBonus = ref<BaseAbilityScores>(emptyScores());

  const totalBonus = computed<BaseAbilityScores>(() => {
    const bg = backgroundBonus.value;
    const ft = featBonus.value;

    return {
      [AbilityKey.STRENGTH]: bg[AbilityKey.STRENGTH] + ft[AbilityKey.STRENGTH],
      [AbilityKey.DEXTERITY]:
        bg[AbilityKey.DEXTERITY] + ft[AbilityKey.DEXTERITY],
      [AbilityKey.CONSTITUTION]:
        bg[AbilityKey.CONSTITUTION] + ft[AbilityKey.CONSTITUTION],
      [AbilityKey.INTELLIGENCE]:
        bg[AbilityKey.INTELLIGENCE] + ft[AbilityKey.INTELLIGENCE],
      [AbilityKey.WISDOM]: bg[AbilityKey.WISDOM] + ft[AbilityKey.WISDOM],
      [AbilityKey.CHARISMA]: bg[AbilityKey.CHARISMA] + ft[AbilityKey.CHARISMA],
    };
  });

  watch(
    totalBonus,
    (next) => {
      if (sameBaseScores(bonus.value, next)) {
        return;
      }

      bonus.value = next;
    },
    { immediate: true },
  );
</script>

<template>
  <div class="space-y-4">
    <UCard>
      <BackgroundAbilityBonus v-model:bonus="backgroundBonus" />
    </UCard>

    <UCard>
      <FeatPicker v-model:bonus="featBonus" />
    </UCard>
  </div>
</template>
