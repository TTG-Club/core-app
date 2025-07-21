<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';
  import { getAbilityInfo } from '~/shared/types';
  import { getModifier } from '~/shared/utils';
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
  ): string {
    const skill = getSkill(skillKey);

    if (!skill) {
      return '+0';
    }

    const abilityInfo = getAbilityInfo(skill.ability);
    const ability = abilities[abilityInfo.shortKey];
    const abilityMod = getModifier(ability.value);
    const total = abilityMod + proficiencyBonus * multiplier;

    return total >= 0 ? `+${total}` : `${total}`;
  }
</script>

<template>
  <USeparator>
    <span class="font-bold text-secondary">Навыки</span>
  </USeparator>

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
            {{ calcModifier(item.skill, item.multiplier) }}
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
      class="col-span-8"
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
      Добавить первый
    </UButton>
  </div>
</template>
