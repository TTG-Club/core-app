<script setup lang="ts">
  import { AbilityKey, getAbilityInfo } from '~/shared/types';

  import type {
    BackgroundSelectResponse,
    BaseAbilityScores,
  } from '~/shared/types';

  const bonus = defineModel<BaseAbilityScores>('bonus', { required: true });
  const backgroundUrl = defineModel<string | undefined>('backgroundUrl');

  const { data: backgrounds } = await useAsyncData<BackgroundSelectResponse[]>(
    () => $fetch('/api/v2/backgrounds/select'),
  );

  const selectedBackground = computed(() =>
    backgrounds.value?.find((b) => b.url === backgroundUrl.value),
  );

  const availableAbilities = computed<AbilityKey[]>(() => {
    if (!selectedBackground.value?.abilityScores) {
      return [];
    }

    return selectedBackground.value.abilityScores
      .map((key) => key as AbilityKey)
      .filter((key) => Object.values(AbilityKey).includes(key));
  });

  const mode = ref<'2_1' | '1_1_1'>('2_1');
  const plusTwo = ref<AbilityKey | undefined>(undefined);
  const plusOne = ref<AbilityKey | undefined>(undefined);

  // Reset selections when background changes
  watch(
    selectedBackground,
    () => {
      plusTwo.value = undefined;
      plusOne.value = undefined;
      mode.value = '2_1';
    },
    { deep: true },
  );

  // Reset plusOne if it matches plusTwo
  watch(plusTwo, (newVal) => {
    if (newVal === plusOne.value) {
      plusOne.value = undefined;
    }
  });

  // Calculate bonuses
  watchEffect(() => {
    const newBonus: BaseAbilityScores = {
      [AbilityKey.STRENGTH]: 0,
      [AbilityKey.DEXTERITY]: 0,
      [AbilityKey.CONSTITUTION]: 0,
      [AbilityKey.INTELLIGENCE]: 0,
      [AbilityKey.WISDOM]: 0,
      [AbilityKey.CHARISMA]: 0,
    };

    if (!selectedBackground.value || availableAbilities.value.length === 0) {
      bonus.value = newBonus;

      return;
    }

    if (mode.value === '1_1_1') {
      // +1 to all available abilities (up to 3)
      for (const ability of availableAbilities.value) {
        newBonus[ability] = 1;
      }
    } else {
      // +2 / +1
      if (plusTwo.value) {
        newBonus[plusTwo.value] = 2;
      }

      if (plusOne.value) {
        newBonus[plusOne.value] = 1;
      }
    }

    bonus.value = newBonus;
  });

  const plusTwoOptions = computed(() => {
    return availableAbilities.value.map((key) => ({
      label: getAbilityInfo(key).label,
      value: key,
    }));
  });

  const plusOneOptions = computed(() => {
    return availableAbilities.value
      .filter((key) => key !== plusTwo.value)
      .map((key) => ({
        label: getAbilityInfo(key).label,
        value: key,
      }));
  });
</script>

<template>
  <div
    v-if="selectedBackground && availableAbilities.length > 0"
    class="space-y-4 rounded-xl border border-default p-4"
  >
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-primary">Бонусы предыстории</h3>

      <div class="flex gap-2">
        <UButton
          size="xs"
          :variant="mode === '2_1' ? 'solid' : 'ghost'"
          label="+2 / +1"
          @click="mode = '2_1'"
        />

        <UButton
          size="xs"
          :variant="mode === '1_1_1' ? 'solid' : 'ghost'"
          label="+1 / +1 / +1"
          @click="mode = '1_1_1'"
        />
      </div>
    </div>

    <div
      v-if="mode === '2_1'"
      class="grid grid-cols-2 gap-4"
    >
      <UFieldGroup label="+2 к характеристике">
        <USelect
          v-model="plusTwo"
          :items="plusTwoOptions"
          placeholder="Выберите характеристику"
          option-attribute="label"
        />
      </UFieldGroup>

      <UFieldGroup label="+1 к характеристике">
        <USelect
          v-model="plusOne"
          :items="plusOneOptions"
          :disabled="!plusTwo"
          placeholder="Выберите характеристику"
          option-attribute="label"
        />
      </UFieldGroup>
    </div>

    <div
      v-else
      class="text-sm text-secondary"
    >
      Вы получаете +1 к характеристикам:
      <div class="mt-2 flex gap-2">
        <UBadge
          v-for="ability in availableAbilities"
          :key="ability"
          color="neutral"
          variant="soft"
        >
          {{ getAbilityInfo(ability).label }}
        </UBadge>
      </div>
    </div>
  </div>
</template>
