<script setup lang="ts">
  import { computed } from 'vue';

  import { ValidationBase } from '~/shared/utils';

  import type { CreateAction } from '~bestiary/types';

  type ActionKey =
    | 'actions'
    | 'bonusActions'
    | 'reactions'
    | 'legendaryActions'
    | 'lairEffects';

  const props = defineProps<{
    name: ActionKey;
    modelValue: CreateAction[];
    description?: string;
    legendaryCount?: number;
    legendaryLairCount?: number;
    legendaryDescription?: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: CreateAction[]): void;
    (e: 'update:description', value: string): void;
    (e: 'update:legendaryCount', value: number): void;
    (e: 'update:legendaryLairCount', value: number): void;
    (e: 'update:legendaryDescription', value: string): void;
  }>();

  const model = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
  });

  const legendaryDescription = computed({
    get: () => props.description ?? '',
    set: (val) => emit('update:legendaryDescription', val),
  });

  const legendaryCount = computed({
    get: () => props.legendaryCount ?? 0,
    set: (val) => emit('update:legendaryCount', val),
  });

  const lairCount = computed({
    get: () => props.legendaryLairCount ?? 0,
    set: (val) => emit('update:legendaryLairCount', val),
  });

  const isLegendary = computed(() => props.name === 'legendaryActions');

  const labelMap: Record<ActionKey, string> = {
    actions: 'Действия',
    bonusActions: 'Бонусные действия',
    reactions: 'Реакции',
    legendaryActions: 'Легендарные действия',
    lairEffects: 'Эффекты логова',
  };

  function getEmptyFeature(): CreateAction {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
      attackType: '',
      sawingThrows: [],
      damageTypes: [],
      recharge: undefined,
      restrictionOfUse: undefined,
    };
  }

  function isLastAction(index: number) {
    return index === model.value.length - 1;
  }

  function addAction(indexOfNewFeature: number) {
    model.value.splice(indexOfNewFeature, 0, getEmptyFeature());
  }

  function removeAction(index: number) {
    model.value.splice(index, 1);
  }
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      :content="labelMap[name] ?? 'Особенности'"
      type="secondary"
      strong
    />
  </ADivider>

  <template v-if="isLegendary">
    <ARow :gutter="16">
      <ACol :span="12">
        <AFormItem
          label="Количество легендарных действий"
          :name="['legendary.count']"
        >
          <AInputNumber
            v-model:value="legendaryCount"
            placeholder="Введи количество"
            min="1"
          />
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="Количество легендарных действий в логове"
          :name="['legendary.inLair']"
        >
          <AInputNumber
            v-model:value="lairCount"
            placeholder="Введи количество"
            min="1"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow>
      <ACol :span="24">
        <AFormItem
          label="Описание легендарных действий"
          :name="['legendary.description']"
        >
          <ATextarea
            v-model:value="legendaryDescription"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="Введите описание легендарных действий (необязательно)"
          />
        </AFormItem>
      </ACol>
    </ARow>
  </template>

  <template
    v-for="(action, actionIndex) in model"
    :key="actionIndex"
  >
    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Название"
          :name="[
            name,
            ...(isLegendary ? ['legendary.actions'] : []),
            actionIndex,
            'name',
            'rus',
          ]"
          :rules="[ValidationBase.ruleRusName()]"
        >
          <AInput
            v-model:value="action.name.rus"
            placeholder="Введи название"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Название (англ.)"
          :name="[
            name,
            ...(isLegendary ? ['legendary.actions'] : []),
            actionIndex,
            'name',
            'eng',
          ]"
          :rules="[ValidationBase.ruleEngName()]"
        >
          <AInput
            v-model:value="action.name.eng"
            placeholder="Введи английское название"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem label="Управление">
          <ARow :gutter="16">
            <ACol :span="12">
              <AButton
                block
                @click.left.exact.prevent="addAction(actionIndex + 1)"
              >
                Добавить
              </AButton>
            </ACol>

            <ACol :span="12">
              <AButton
                danger
                block
                @click.left.exact.prevent="removeAction(actionIndex)"
              >
                Удалить
              </AButton>
            </ACol>
          </ARow>
        </AFormItem>
      </ACol>
    </ARow>

    <ARow>
      <ACol :span="24">
        <AFormItem
          label="Описание"
          :name="[
            name,
            ...(isLegendary ? ['legendary.actions'] : []),
            actionIndex,
            'description',
          ]"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="action.description"
            :auto-size="{ minRows: 3, maxRows: 8 }"
            placeholder="Введи описание"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ADivider v-if="!isLastAction(actionIndex)" />
  </template>

  <AFlex
    v-if="!model.length"
    justify="center"
  >
    <AButton @click.left.exact.prevent="addAction(0)">
      Добавить первое
    </AButton>
  </AFlex>
</template>
