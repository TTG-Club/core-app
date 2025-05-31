<script setup lang="ts">
  import { ABILITIES } from '~/shared/types';
  import { getFormattedModifier, getModifier } from '~/shared/utils';
  import { SelectMastery } from '~ui/select';

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
          <template #addonAfter>
            {{ getFormattedModifier(model[ability.shortKey].value) }}
          </template>
        </AInputNumber>
      </AFormItem>
    </ACol>
  </ARow>

  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Спасброски"
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
        :label="ability.label"
        :name="['abilities', ability.shortKey, 'multiplier']"
      >
        <AInputGroup
          :style="{ display: 'flex' }"
          compact
        >
          <SelectMastery
            v-model="model[ability.shortKey].multiplier"
            :style="{ flex: '1 1 100%' }"
          />

          <div
            :style="{
              display: 'table-cell',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid #74748040',
              padding: '0 11px',
              lineHeight: '30px',
              verticalAlign: 'middle',
            }"
          >
            {{
              calcModifier(
                model[ability.shortKey].value,
                model[ability.shortKey].multiplier,
              )
            }}
          </div>
        </AInputGroup>
      </AFormItem>
    </ACol>
  </ARow>
</template>
