<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';
  import { getAbilityInfo } from '~/shared/types';
  import { EditorArrayControls } from '~ui/editor';
  import { SelectMastery, SelectSkills } from '~ui/select';

  import type { CreateAbilities, CreateSkill } from '~bestiary/types';

  const { abilities, proficiencyBonus = 0 } = defineProps<{
    abilities: CreateAbilities;
    proficiencyBonus?: number;
  }>();

  const model = defineModel<Array<CreateSkill>>({ required: true });

  const { data: skills } = await useAsyncData(
    'dictionaries-skills',
    () => DictionaryService.skills(),
    { dedupe: 'defer' },
  );

  function getEmpty(): CreateSkill {
    return {
      skill: undefined,
      text: undefined,
      bonus: 0,
      multiplier: 0,
    };
  }

  function getSkill(key: string | undefined) {
    if (!key) {
      return undefined;
    }

    return skills.value?.find((skill) => skill.value === key);
  }

  function calcModifier(
    skillKey: string | undefined,
    multiplier: number,
    bonus: number,
  ): string {
    const skill = getSkill(skillKey);

    if (!skill) {
      return '+0';
    }

    const abilityInfo = getAbilityInfo(skill.ability);
    const ability = abilities[abilityInfo.shortKey];
    const abilityMod = getModifier(ability.value);
    const total = abilityMod + proficiencyBonus * multiplier + bonus;

    return total >= 0 ? `+${total}` : `${total}`;
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Навыки</h2>
    </template>

    <div class="grid gap-4">
      <UForm
        v-for="(item, index) in model"
        :key="index"
        class="col-span-full grid grid-cols-24 gap-4"
        attach
        :state="item"
      >
        <UFormField
          class="col-span-6"
          label="Навык"
          name="skill"
        >
          <div class="flex">
            <SelectSkills
              v-model="item.skill"
              class="flex-grow"
            >
              <template #trailing>
                {{ calcModifier(item.skill, item.multiplier, item.bonus) }}
              </template>
            </SelectSkills>
          </div>
        </UFormField>

        <UFormField
          class="col-span-4"
          label="Уровень владения"
          name="multiplier"
        >
          <SelectMastery v-model="item.multiplier" />
        </UFormField>

        <UFormField
          class="col-span-2"
          label="Бонус"
          name="bonus"
        >
          <UInputNumber
            v-model="item.bonus"
            :precision="0"
            placeholder="Введи бонус"
            :min="-10"
            :max="10"
          >
          </UInputNumber>
        </UFormField>

        <UFormField
          class="col-span-6"
          label="Пояснение"
          name="text"
        >
          <UInput
            v-model="item.text"
            placeholder="Например, только понимает или древний диалект"
          />
        </UFormField>

        <EditorArrayControls
          v-model="model"
          :empty-object="getEmpty()"
          :index
          :item
          only-remove
        />
      </UForm>

      <div
        v-if="!model.length"
        class="col-span-full flex justify-center"
      >
        <UButton @click.left.exact.prevent="model.push(getEmpty())">
          Добавить
        </UButton>
      </div>
    </div>
  </UCard>
</template>
