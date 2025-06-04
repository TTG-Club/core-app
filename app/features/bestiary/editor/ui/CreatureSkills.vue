<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';
  import { getAbilityInfo } from '~/shared/types';
  import { getModifier, ValidationDictionaries } from '~/shared/utils';
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
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Навыки"
      strong
    />
  </ADivider>

  <ARow
    v-for="(item, index) in model"
    :key="index"
    :gutter="16"
  >
    <ACol :span="6">
      <AFormItem
        label="Навык"
        :name="['skills', index, 'skill']"
        :rules="[ValidationDictionaries.ruleSkills()]"
      >
        <AInputGroup
          :style="{ display: 'flex' }"
          compact
        >
          <SelectSkills
            v-model="item.skill"
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
            {{ calcModifier(item.skill, item.multiplier) }}
          </div>
        </AInputGroup>
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Уровень владения"
        :name="['skills', index, 'multiplier']"
      >
        <SelectMastery v-model="item.multiplier" />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Пояснение"
        :name="['skills', index, 'text']"
      >
        <AInput
          v-model:value="item.text"
          :placeholder="`Например, только понимает или древний диалект`"
        />
      </AFormItem>
    </ACol>

    <EditorArrayControls
      v-model="model"
      :empty-object="getEmpty()"
      :index
      :item
      only-remove
    />
  </ARow>

  <AFlex
    v-if="!model.length"
    :style="{ marginBottom: '24px' }"
    justify="center"
  >
    <AButton @click.left.exact.prevent="model.push(getEmpty())">
      Добавить первый
    </AButton>
  </AFlex>
</template>
