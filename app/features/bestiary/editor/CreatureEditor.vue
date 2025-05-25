<script setup lang="ts">
  import { isNumber } from 'lodash-es';

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
  } from './ui';

  import { ValidationBase, getModifier } from '~/shared/utils';
  import { EditorBaseInfo } from '~ui/editor';
  import {
    SelectAlignment,
    SelectCondition,
    SelectDamageType,
  } from '~ui/select';

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

  const hitDieSizeMap: Record<string, number> = {
    TINY: 4,
    SMALL: 6,
    MEDIUM: 8,
    LARGE: 10,
    HUGE: 12,
    GARGANTUAN: 20,
  };

  watch(
    () => [
      form.value.hit.countHitDice,
      form.value.abilities.con.value,
      form.value.size.size?.[0],
    ],
    ([count, conValue, sizeKey]) => {
      const dieSize = hitDieSizeMap[sizeKey ?? 'MEDIUM'] || 8;

      const conMod = getModifier(
        typeof conValue === 'number'
          ? conValue
          : Number.parseInt(conValue || '0', 10),
      );

      if (typeof count === 'number') {
        const bonus = count * conMod;

        form.value.hit.formula = `${count}к${dieSize}${bonus > 0 ? ` + ${bonus}` : ''}`;
      }
    },
  );

  /**
   * Получение Бонуса Мастерства в зависимости от Показателя Опасности.
   *
   * @param cr показатель опасности.
   */
  function getProficiencyBonus(cr: number | unknown): number {
    if (!isNumber(cr)) {
      return 2;
    }

    const clampedCR = Math.max(0, Math.min(30, cr));

    return Math.min(9, 2 + Math.floor((clampedCR - 1) / 4));
  }

  watch(
    () => form.value.experience.value,
    (cr) => {
      form.value.proficiencyBonus = getProficiencyBonus(cr);
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
      <CreatureType v-model="form.type" />

      <CreatureSize v-model="form.size" />

      <ACol :span="4">
        <AFormItem
          label="Мировоззрение существа"
          :name="['alignment']"
        >
          <SelectAlignment v-model="form.alignment" />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow :gutter="16">
      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Статблок"
          strong
        />
      </ADivider>

      <ACol :span="4">
        <AFormItem
          label="КД"
          tooltip="Класс доспеха"
          :name="['ac']"
        >
          <AInputNumber
            v-model:value="form.ac"
            :precision="0"
            placeholder="Введи класс доспеха"
            min="0"
          />
        </AFormItem>
      </ACol>

      <ACol :span="4">
        <AFormItem
          label="Инициатива"
          :name="['initiative']"
        >
          <AInputNumber
            v-model:value="form.initiative"
            :precision="0"
            placeholder="Введи инициативу"
            min="0"
            addon-before="+"
            :addon-after="10 + form.initiative"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <CreatureHit v-model="form" />

    <CreatureSpeed v-model="form.speed" />

    <CreatureAbilities
      v-model="form.abilities"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureSkills
      v-model:model="form.skills"
      :abilities="form.abilities"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <ARow :gutter="16">
      <ACol :span="6">
        <AFormItem
          label="Уязвимость к урону"
          :name="['vulnerabilities']"
        >
          <SelectDamageType
            v-model="form.vulnerabilities"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Сопротивление к урону"
          :name="['resistance']"
        >
          <SelectDamageType
            v-model="form.resistance"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Иммунитет к урону"
          :name="['immunityToDamage']"
        >
          <SelectDamageType
            v-model="form.immunityToDamage"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Иммунитет к состояниям"
          :name="['immunityToDamage']"
        >
          <SelectCondition
            v-model="form.immunityToCondition"
            multiple
          />
        </AFormItem>
      </ACol>
    </ARow>

    <CreatureSenses v-model="form.senses" />

    <CreatureLanguages v-model="form.languages" />

    <CreatureChallengeRating
      v-model="form.experience"
      :proficiency-bonus="form.proficiencyBonus"
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
    </ARow>
  </AForm>
</template>
