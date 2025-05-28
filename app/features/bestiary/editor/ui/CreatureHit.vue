<script setup lang="ts">
  import { getModifier } from '~/shared/utils';

  import type { CreateAbility, CreateHit, CreatureSize } from '~bestiary/types';

  const model = defineModel<CreateHit>({
    required: true,
  });

  const { size, constitution } = defineProps<{
    size: CreatureSize;
    constitution: CreateAbility;
  }>();

  const diceSize = computed(() => {
    const currentSize = size.size[0] ?? 'MEDIUM';

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
        return 8;
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

  const diceAvg = computed(() => (diceSize.value + 1) / 2);

  const avgHit = computed(() => {
    const count = model.value.countHitDice;

    if (!count) {
      return 0;
    }

    const total = count * diceAvg.value + bonus.value;

    return Math.floor(total);
  });

  watchImmediate(formula, (value) => {
    model.value.formula = value;
  });

  watchImmediate(avgHit, (value) => {
    model.value.hit = value;
  });
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Хиты"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="4">
      <AFormItem
        label="Количество костей хитов"
        :name="['hit', 'countHitDice']"
      >
        <AInputNumber
          v-model:value="model.countHitDice"
          placeholder="Введи количество"
          min="0"
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem label="Формула">
        <AInput
          v-model:value="model.formula"
          disabled
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Среднее количество хитов"
        :name="['hit', 'hit']"
      >
        <AInputNumber
          v-model:value="model.hit"
          placeholder="Введи количество хитов"
          min="1"
        />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem
        label="Текстовое описание"
        :name="['hit', 'text']"
      >
        <AInput
          v-model:value="model.text"
          placeholder="Текстовое описани хитов"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
