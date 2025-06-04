<script setup lang="ts">
  import {
    SpellCastingTimes,
    SpellRanges,
    SpellDurations,
    SpellComponents,
  } from './ui';

  import { ValidationBase, ValidationDictionaries } from '~/shared/utils';
  import { EditorBaseInfo } from '~ui/editor';
  import {
    SelectAbilities,
    SelectDamageType,
    SelectHealType,
    SelectMagicSchool,
    SelectSpecies,
  } from '~ui/select';

  import type { FormInstance } from 'ant-design-vue';
  import type { SpellCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<SpellCreate>({ required: true });

  const formRef = useTemplateRef<FormInstance>('formRef');

  const spellLevels = Array.from(Array(10)).map((_, index) => ({
    label: !index ? 'Заговор' : `${index} круг`,
    value: index,
  }));

  defineExpose({
    validate: computed(() => formRef.value?.validate),
  });
</script>

<template>
  <AForm
    ref="formRef"
    layout="vertical"
    :model="form"
    :disabled="isCreating"
  >
    <EditorBaseInfo
      v-model="form"
      section="spells"
    />

    <ARow :gutter="16">
      <ACol :span="12">
        <AFormItem
          label="Уровень заклинания"
          :name="['level']"
        >
          <ASelect
            v-model:value="form.level"
            placeholder="Выбери уровень"
            :options="spellLevels"
          />
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="Школа"
          :name="['school']"
          :rules="[ValidationDictionaries.ruleMagicSchools()]"
        >
          <SelectMagicSchool v-model="form.school" />
        </AFormItem>
      </ACol>
    </ARow>

    <SpellCastingTimes v-model="form.castingTime" />

    <SpellRanges v-model="form.range" />

    <SpellComponents v-model="form.components" />

    <SpellDurations v-model="form.duration" />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Дополнительные фильтры"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Типы урона"
          :name="['damageType']"
        >
          <SelectDamageType
            v-model="form.damageType"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Спасброски"
          :name="['savingThrow']"
        >
          <SelectAbilities
            v-model="form.savingThrow"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Типы лечения"
          :name="['healingType']"
        >
          <SelectHealType
            v-model="form.healingType"
            multiple
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Описание"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="12">
        <AFormItem
          label="Описание"
          :name="['description']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="form.description"
            :rows="8"
            placeholder="Введи описание"
            allow-clear
          />
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="На более высоких уровнях"
          :name="['upper']"
        >
          <ATextarea
            v-model:value="form.upper"
            :rows="8"
            placeholder="Введи описание"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Принадлежность"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="6">
        <AFormItem
          label="Классы"
          :name="['affiliations', 'classes']"
        >
          <SelectSpecies
            v-model="form.affiliations.classes"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Архетипы"
          :name="['affiliations', 'subclasses']"
        >
          <SelectSpecies
            v-model="form.affiliations.subclasses"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Виды"
          :name="['affiliations', 'species']"
        >
          <SelectSpecies
            v-model="form.affiliations.species"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Происхождения"
          :name="['affiliations', 'lineages']"
        >
          <SelectSpecies
            v-model="form.affiliations.lineages"
            multiple
          />
        </AFormItem>
      </ACol>
    </ARow>
  </AForm>
</template>
