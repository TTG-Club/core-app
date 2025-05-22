<script setup lang="ts">
  import { Dictionaries } from '~/shared/api';
  import { modifier } from '~/shared/utils';
  import AbilityBonusModeSelect from '~bestiary/editor/ui/type/AbilityBonusModeSelect.vue';

  import type { CreateAbilities } from '~bestiary/types';

  const props = defineProps<{
    proficiencyBonus: number;
  }>();

  const model = defineModel<CreateAbilities>({ required: true });

  const keys = ['str', 'dex', 'con', 'int', 'wis', 'chr'] as const;

  const abilityMap: Record<(typeof keys)[number], string> = {
    str: 'STRENGTH',
    dex: 'DEXTERITY',
    con: 'CONSTITUTION',
    int: 'INTELLIGENCE',
    wis: 'WISDOM',
    chr: 'CHARISMA',
  };

  const { data: abilities } = await useAsyncData('dictionaries-abilities', () =>
    Dictionaries.abilities(),
  );

  const labels = computed(() => {
    const raw = abilities.value ?? [];
    const result: Partial<Record<(typeof keys)[number], string>> = {};

    for (const [key, sysName] of Object.entries(abilityMap)) {
      const entry = raw.find((a) => a.value === sysName);

      result[key as (typeof keys)[number]] = entry?.label ?? key.toUpperCase();
    }

    return result as Record<(typeof keys)[number], string>;
  });

  /**
   * Расчёт модификатора с учётом бонуса мастерства и режима (0 | 1 | 2)
   */
  function calculateTotalModifier(baseValue: number, mod: number): string {
    const abilityMod = modifier(baseValue);

    const total = abilityMod + props.proficiencyBonus * mod;

    return total >= 0 ? `+${total}` : `${total}`;
  }
</script>

<template>
  <ARow :gutter="16">
    <ACol
      v-for="key in keys"
      :key="key"
      :span="4"
    >
      <AFormItem
        :label="labels[key]"
        :name="['abilities', key, 'value']"
      >
        <AInputNumber
          v-model:value="model[key].value"
          :precision="0"
          min="0"
          max="30"
          :addon-after="
            calculateTotalModifier(model[key].value, model[key].multiplier)
          "
        >
          <template #addonBefore>
            <AbilityBonusModeSelect v-model="model[key].multiplier" />
          </template>
        </AInputNumber>
      </AFormItem>
    </ACol>
  </ARow>
</template>
