<script setup lang="ts">
  import { SelectMastery } from '~ui/select';

  import { ABILITIES } from '~/shared/types';

  import type { CreateAbilities } from '~bestiary/model';

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
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        Характеристики | Спасброски
      </h2>
    </template>

    <div class="grid gap-4">
      <UForm
        class="col-span-full grid grid-cols-24 gap-4"
        attach
        :state="model"
      >
        <UFormField
          v-for="ability in ABILITIES"
          :key="ability.key"
          class="col-span-4"
          :label="ability.label"
          :name="ability.shortKey + '.value'"
        >
          <UFieldGroup>
            <UInputNumber
              v-model="model[ability.shortKey].value"
              :precision="0"
              :min="0"
              :max="30"
            />

            <UBadge
              color="neutral"
              variant="subtle"
            >
              {{ getFormattedModifier(model[ability.shortKey].value) }}
            </UBadge>
          </UFieldGroup>
        </UFormField>
      </UForm>

      <UForm
        class="col-span-full grid grid-cols-24 gap-4"
        attach
        :state="model"
      >
        <UFormField
          v-for="ability in ABILITIES"
          :key="ability.key"
          class="col-span-4"
          :label="ability.label"
          :name="ability.shortKey + '.multiplier'"
        >
          <div class="flex">
            <SelectMastery
              v-model="model[ability.shortKey].multiplier"
              class="flex-grow"
            >
              <template #trailing>
                {{
                  calcModifier(
                    model[ability.shortKey].value,
                    model[ability.shortKey].multiplier,
                  )
                }}
              </template>
            </SelectMastery>
          </div>
        </UFormField>
      </UForm>
    </div>
  </UCard>
</template>
