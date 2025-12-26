<script setup lang="ts">
  import FeatPicker from './FeatPicker.vue';

  import { AbilityKey } from '~/shared/types';
  import BackgroundAbilityBonus from '~ui/calculator/ability/BackgroundAbilityBonus.vue';

  type AbilityScores = Record<AbilityKey, number>;

  const bonus = defineModel<AbilityScores>('bonus', {
    required: true,
  });

  const backgroundBonus = ref<AbilityScores>();
  const featBonus = ref<AbilityScores>();

  watch(
    [backgroundBonus, featBonus],
    () => {
      bonus.value = {
        [AbilityKey.STRENGTH]:
          (backgroundBonus.value?.STRENGTH ?? 0) +
          (featBonus.value?.STRENGTH ?? 0),

        [AbilityKey.DEXTERITY]:
          (backgroundBonus.value?.DEXTERITY ?? 0) +
          (featBonus.value?.DEXTERITY ?? 0),

        [AbilityKey.CONSTITUTION]:
          (backgroundBonus.value?.CONSTITUTION ?? 0) +
          (featBonus.value?.CONSTITUTION ?? 0),

        [AbilityKey.INTELLIGENCE]:
          (backgroundBonus.value?.INTELLIGENCE ?? 0) +
          (featBonus.value?.INTELLIGENCE ?? 0),

        [AbilityKey.WISDOM]:
          (backgroundBonus.value?.WISDOM ?? 0) + (featBonus.value?.WISDOM ?? 0),

        [AbilityKey.CHARISMA]:
          (backgroundBonus.value?.CHARISMA ?? 0) +
          (featBonus.value?.CHARISMA ?? 0),
      };
    },
    { immediate: true, deep: true },
  );
</script>

<template>
  <div class="space-y-4">
    <UCard>
      <BackgroundAbilityBonus v-model="backgroundBonus" />
    </UCard>

    <UCard>
      <FeatPicker v-model:bonus="featBonus" />
    </UCard>
  </div>
</template>
