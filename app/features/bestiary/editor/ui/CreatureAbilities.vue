<script setup lang="ts">
  import { ABILITIES } from '~/shared/types';
  import { getModifier } from '~/shared/utils';
  import { AbilityMastery } from '~ui/editor';

  import type { CreateAbilities } from '~bestiary/types';

  const { proficiencyBonus } = defineProps<{
    proficiencyBonus: number;
  }>();

  const model = defineModel<CreateAbilities>({ required: true });

  function calcModifier(ability: number, multiplier: number): string {
    const abilityMod = getModifier(ability);
    const total = abilityMod + proficiencyBonus * multiplier;

    return total >= 0 ? `+${total}` : `${total}`;
  }
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Характеристики"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol
      v-for="ability in ABILITIES"
      :key="ability.key"
      :span="4"
    >
      <AFormItem
        :name="['abilities', ability.shortKey, 'value']"
        :label="ability.label"
      >
        <AInputNumber
          v-model:value="model[ability.shortKey].value"
          :precision="0"
          min="0"
          max="30"
        >
          <template #addonBefore>
            <AbilityMastery v-model="model[ability.shortKey].multiplier" />
          </template>

          <template #addonAfter>
            {{
              calcModifier(
                model[ability.shortKey].value,
                model[ability.shortKey].multiplier,
              )
            }}
          </template>
        </AInputNumber>
      </AFormItem>
    </ACol>
  </ARow>
</template>
