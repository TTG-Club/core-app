<script setup lang="ts">
  import {
    ValidationBase,
    ValidationBackground,
    modifier,
  } from '~/shared/utils';
  import { BeastType } from '~bestiary/editor/ui';
  import BeastAbilities from '~bestiary/editor/ui/BeastAbilities.vue';
  import BeastAction from '~bestiary/editor/ui/BeastAction.vue';
  import BeastHit from '~bestiary/editor/ui/BeastHit.vue';
  import BeastSenses from '~bestiary/editor/ui/BeastSenses.vue';
  import BeastSkills from '~bestiary/editor/ui/BeastSkills.vue';
  import BeastSpeed from '~bestiary/editor/ui/BeastSpeed.vue';
  import BeastTrait from '~bestiary/editor/ui/BeastTrait.vue';
  import ChallengeRating from '~bestiary/editor/ui/ChallengeRating.vue';
  import SelectAlignment from '~bestiary/editor/ui/SelectAlignments.vue';
  import SelectConditionImmunities from '~bestiary/editor/ui/SelectConditionImmunities.vue';
  import SelectDamageImmunities from '~bestiary/editor/ui/SelectDamageImmunities.vue';
  import SelectLanguages from '~bestiary/editor/ui/SelectLanguages.vue';
  import SelectResistance from '~bestiary/editor/ui/SelectResistence.vue';
  import SelectVulnerability from '~bestiary/editor/ui/SelectVurnulability.vue';
  import { BeastSize } from '~bestiary/editor/ui/size';
  import { InputUrl } from '~ui/input';
  import { SelectSource, SelectTags } from '~ui/select';

  import type { FormInstance } from 'ant-design-vue';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { BeastCreate } from '~/features/bestiary/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<BeastCreate>({ required: true });

  const {
    params: { url: oldUrl },
  } = useRoute();

  const formRef = useTemplateRef<FormInstance>('formRef');

  const handleBookChange = (value: SelectValue) => {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      form.value.source.page = undefined;
    }

    form.value.source.url = value;
  };

  defineExpose({
    validate: computed(() => formRef.value?.validate),
  });

  watch(
    () => form.value.abilities.dex.value,
    (val) => {
      form.value.initiative = modifier(val);
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

      const conMod = modifier(
        typeof conValue === 'number'
          ? conValue
          : Number.parseInt(conValue || '0', 10),
      );

      if (typeof count === 'number') {
        const bonus = count * conMod;

        form.value.hit.formula = `${count}к${dieSize}${bonus > 0 ? ` + ${bonus}` : ''}`;
      }
    },
    { immediate: true },
  );

  watch(
    () => form.value.experience.value,
    (cr) => {
      if (typeof cr !== 'number') return;

      if (cr <= 4) form.value.proficiencyBonus = 2;
      else if (cr <= 8) form.value.proficiencyBonus = 3;
      else if (cr <= 12) form.value.proficiencyBonus = 4;
      else if (cr <= 16) form.value.proficiencyBonus = 5;
      else if (cr <= 20) form.value.proficiencyBonus = 6;
      else if (cr <= 24) form.value.proficiencyBonus = 7;
      else if (cr <= 28) form.value.proficiencyBonus = 8;
      else form.value.proficiencyBonus = 9;
    },
    { immediate: true },
  );
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
          :rules="[ValidationBackground.ruleUrl(oldUrl)]"
        >
          <InputUrl
            v-model="form.url"
            :eng-name="form.name.eng"
            :source-url="form.source.url"
            :addon-before="`${getOrigin()}/backgrounds/`"
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
      <BeastType v-model="form.type" />

      <BeastSize v-model="form.size" />

      <SelectAlignment v-model="form.alignment" />
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

    <BeastHit v-model="form" />

    <BeastSpeed v-model="form.speed" />

    <BeastAbilities
      v-model="form.abilities"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <BeastSkills
      v-model:model="form.skills"
      :abilities="form.abilities"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <ARow :gutter="16">
      <SelectVulnerability v-model="form.vulnerabilities" />

      <SelectResistance v-model="form.resistance" />

      <SelectDamageImmunities v-model="form.immunityToDamage" />
    </ARow>

    <SelectConditionImmunities v-model="form.immunityToCondition" />

    <BeastSenses v-model="form.senses" />

    <SelectLanguages v-model="form.languages" />

    <ChallengeRating
      v-model="form.experience"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <BeastTrait v-model="form.traits" />

    <BeastAction
      v-model="form.actions"
      name="actions"
    />

    <BeastAction
      v-model="form.bonusActions"
      name="bonusActions"
    />

    <BeastAction
      v-model="form.reactions"
      name="reactions"
    />

    <BeastAction
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
