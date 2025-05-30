<script setup lang="ts">
  import {
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
  } from './ui';

  import { ValidationBase, getModifier } from '~/shared/utils';
  import CreatureSection from '~bestiary/editor/ui/CreatureSection.vue';
  import { EditorBaseInfo } from '~ui/editor';
  import { SelectAlignment } from '~ui/select';

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

  watch(
    () => form.value.abilities.dex.value,
    (val) => {
      form.value.initiative = getModifier(val);
    },
  );
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
      section="bestiary"
    />

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
      <ACol :span="3">
        <AFormItem
          label="КД"
          tooltip="Класс доспеха"
          :name="['ac']"
        >
          <AInputNumber
            v-model:value="form.ac"
            :precision="0"
            placeholder="Введи КД"
            min="0"
          />
        </AFormItem>
      </ACol>

      <ACol :span="3">
        <AFormItem
          label="Инициатива"
          :name="['initiative']"
        >
          <AInputNumber
            v-model:value="form.initiative"
            :precision="0"
            placeholder="Введи инициативу"
            min="0"
            :addon-after="`+${10 + form.initiative}`"
          />
        </AFormItem>
      </ACol>

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

    <CreatureSection v-model="form.section" />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Описание"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="24">
        <AFormItem
          label="Описание"
          :name="['description']"
          :rules="[ValidationBase.ruleString(false)]"
        >
          <ATextarea
            v-model:value="form.description"
            :rows="8"
            placeholder="Введи описание"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>
  </AForm>
</template>
