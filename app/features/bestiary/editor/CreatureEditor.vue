<script setup lang="ts">
  import {
    CreatureSection,
    CreatureChallengeRating,
    CreatureAbilities,
    CreatureAction,
    CreatureHit,
    CreatureLanguages,
    CreatureSenses,
    CreatureSize,
    CreatureSkills,
    CreatureSpeed,
    CreatureTrait,
    CreatureType,
    CreatureDefenses,
    CreatureInitiative,
  } from './ui';

  import { ValidationBase } from '~/shared/utils';
  import { EditorBaseInfo } from '~ui/editor';
  import { SelectAlignment } from '~ui/select';
  import { UploadImage } from '~ui/upload';

  import type { FormInstance } from 'ant-design-vue';
  import type { CreatureCreate } from '~bestiary/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<CreatureCreate>({ required: true });

  const formRef = useTemplateRef<FormInstance>('formRef');

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
    <CreatureSection v-model="form.section" />

    <EditorBaseInfo
      v-model="form"
      section="bestiary"
    />

    <ARow :gutter="16">
      <ACol :span="24">
        <AFormItem
          label="Описание"
          :name="['description']"
          :rules="[ValidationBase.ruleString(false)]"
        >
          <ATextarea
            v-model:value="form.description"
            :rows="4"
            placeholder="Введи описание"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Заголовок"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <CreatureType v-model="form.types" />

      <ACol :span="8">
        <AFormItem
          label="Мировоззрение существа"
          :name="['alignment']"
        >
          <SelectAlignment v-model="form.alignment" />
        </AFormItem>
      </ACol>
    </ARow>

    <CreatureSize v-model="form.sizes" />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Статблок"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="КД"
          tooltip="Класс доспеха"
          :name="['ac', 'value']"
        >
          <AInputNumber
            v-model:value="form.ac.value"
            :precision="0"
            placeholder="Введи КД"
            min="0"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Текст к КД"
          :name="['ac', 'text']"
        >
          <AInput
            v-model:value="form.ac.text"
            placeholder="Введи текст"
          />
        </AFormItem>
      </ACol>

      <CreatureInitiative
        v-model="form.initiative"
        :dex="form.abilities.dex"
        :proficiency-bonus="form.proficiencyBonus"
      />

      <CreatureHit
        v-model="form.hit"
        :sizes="form.sizes"
        :constitution="form.abilities.con"
      />
    </ARow>

    <CreatureSpeed v-model="form.speeds" />

    <CreatureAbilities
      v-model="form.abilities"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureSkills
      v-model="form.skills"
      :abilities="form.abilities"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureDefenses
      v-model:vulnerabilities="form.vulnerabilities"
      v-model:resistance="form.resistance"
      v-model:immunity-to-damage="form.immunityToDamage"
      v-model:immunity-to-condition="form.immunityToCondition"
    />

    <CreatureSenses
      v-model="form.senses"
      :wisdom="form.abilities.wis"
      :skills="form.skills"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureLanguages v-model="form.languages" />

    <CreatureChallengeRating
      v-model="form.experience"
      v-model:proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureTrait v-model="form.traits" />

    <CreatureAction
      v-model="form.actions"
      name="actions"
    />

    <CreatureAction
      v-model="form.bonusActions"
      name="bonusActions"
    />

    <CreatureAction
      v-model="form.reactions"
      name="reactions"
    />

    <CreatureAction
      v-model="form.legendaryActions"
      name="legendaryActions"
    />
  </AForm>

  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Изображения"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Основное"
        tooltip="Эта картинка отображается при просмотре страницы существа"
        :name="['image']"
      >
        <UploadImage
          v-model="form.image"
          section="bestiary"
          max-size="480"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
