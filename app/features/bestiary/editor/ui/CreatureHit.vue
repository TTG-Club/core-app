<script setup lang="ts">
  import type {
    CreateAbility,
    CreateHit,
    CreatureSizes,
  } from '~bestiary/types';

  const model = defineModel<CreateHit>({
    required: true,
  });

  const { sizes, constitution } = defineProps<{
    sizes: CreatureSizes;
    constitution: CreateAbility;
  }>();

  const diceSize = computed(() => {
    if (!sizes.values.length) {
      return undefined;
    }

    const currentSize = sizes.values[sizes.values.length - 1];

    switch (currentSize) {
      case 'GARGANTUAN':
        return 20;
      case 'HUGE':
        return 12;
      case 'LARGE':
        return 10;
      case 'MEDIUM':
        return 8;
      case 'SMALL':
        return 6;
      case 'TINY':
        return 4;
      default:
        return undefined;
    }
  });

  const modifier = computed(() => getModifier(constitution.value));

  const bonus = computed(() => {
    const count = model.value.countHitDice;

    return count ? count * modifier.value : 0;
  });

  const formula = computed(() => {
    const count = model.value.countHitDice;

    if (!count) {
      return undefined;
    }

    if (!bonus.value) {
      return `${count}к${diceSize.value}`;
    }

    const formated =
      bonus.value > 0 ? ` + ${bonus.value}` : ` - ${Math.abs(bonus.value)}`;

    return `${count}к${diceSize.value}${formated}`;
  });

  const diceAvg = computed(() => {
    if (!diceSize.value) {
      return undefined;
    }

    return (diceSize.value + 1) / 2;
  });

  const avgHit = computed(() => {
    const count = model.value.countHitDice;

    if (!count || !diceAvg.value) {
      return undefined;
    }

    const total = count * diceAvg.value + bonus.value;

    return Math.floor(total);
  });

  watchImmediate(avgHit, (value) => {
    if (!value) {
      return;
    }

    model.value.value = value;
  });
</script>

<template>
  <UForm
    class="grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-4"
      label="Количество костей хитов"
      name="countHitDice"
    >
      <UInputNumber
        v-model="model.countHitDice"
        placeholder="Введи количество"
        :min="0"
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Формула"
    >
      <UInput
        :model-value="formula"
        disabled
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Среднее количество хитов"
      name="value"
    >
      <UInputNumber
        v-model="model.value"
        placeholder="Введи количество хитов"
        :min="1"
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Текстовое описание"
      name="text"
    >
      <UInput
        v-model="model.text"
        placeholder="Текстовое описание хитов"
      />
    </UFormField>
  </UForm>
</template>
