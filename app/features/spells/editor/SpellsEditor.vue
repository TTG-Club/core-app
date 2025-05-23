<script setup lang="ts">
  import {
    SpellCastingTimes,
    SpellRanges,
    SpellDurations,
    SpellComponents,
  } from './ui';

  import {
    ValidationBase,
    ValidationSpell,
    ValidationDictionaries,
  } from '~/shared/utils';
  import { InputUrl } from '~ui/input';
  import {
    SelectAbilities,
    SelectDamageType,
    SelectHealType,
    SelectMagicSchool,
    SelectSource,
    SelectSpecies,
    SelectTags,
  } from '~ui/select';

  import type { FormInstance } from 'ant-design-vue';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { SpellCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<SpellCreate>({ required: true });

  const {
    params: { url: oldUrl },
  } = useRoute();

  const formRef = useTemplateRef<FormInstance>('formRef');

  const spellLevels = Array.from(Array(10)).map((_, index) => ({
    label: !index ? 'Заговор' : `${index} круг`,
    value: index,
  }));

  function handleBookChange(value: SelectValue) {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      form.value.source.page = undefined;
    }

    form.value.source.url = value;
  }

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
    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Основная информация"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Название"
          :name="['name', 'rus']"
          :rules="[ValidationBase.ruleRusName()]"
        >
          <AInput
            v-model:value="form.name.rus"
            placeholder="Введи название"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Название (англ.)"
          tooltip="Английское название"
          :name="['name', 'eng']"
          :rules="[ValidationBase.ruleEngName()]"
        >
          <AInput
            v-model:value="form.name.eng"
            placeholder="Введи английское название"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Название (альт.)"
          tooltip="Альтернативные названия. Используется для поиска и СЕО."
          :name="['name', 'alt']"
        >
          <SelectTags
            v-model="form.name.alt"
            placeholder="Введи альтернативные названия"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow :gutter="16">
      <ACol :span="16">
        <AFormItem
          label="Источник"
          tooltip="Книга, из которой взята информация о виде, если она существует"
          :name="['source', 'url']"
        >
          <SelectSource
            :model-value="form.source.url"
            @update:model-value="handleBookChange"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Страница в источнике"
          tooltip="Номер страницы книги, откуда была взята информация о виде, если выбрана сама книга"
          :name="['source', 'page']"
          :rules="[ValidationBase.ruleSourcePage(!!form.source.url)]"
        >
          <AInputNumber
            v-model:value="form.source.page"
            :disabled="!form.source.url"
            :precision="0"
            placeholder="Введи номер страницы"
            min="0"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow :gutter="16">
      <ACol :span="12">
        <AFormItem
          label="Теги"
          tooltip="Используются для поиска и СЕО"
          :name="['tags']"
        >
          <SelectTags
            v-model="form.tags"
            placeholder="Введи теги"
          />
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="URL"
          tooltip="Менять только при необходимости, т.к. URL генерируется автоматически при вводе английского названия"
          :name="['url']"
          :rules="[ValidationSpell.ruleUrl(oldUrl)]"
        >
          <InputUrl
            v-model="form.url"
            :eng-name="form.name.eng"
            :source-url="form.source.url"
            :addon-before="`${getOrigin()}/spells/`"
          />
        </AFormItem>
      </ACol>
    </ARow>

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
          :rules="[ValidationDictionaries.ruleMagicSchool()]"
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
