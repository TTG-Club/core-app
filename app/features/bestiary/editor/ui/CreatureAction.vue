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
  }>();

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

  const model = defineModel<any>({ default: () => [] });

  const actionsList = computed<Array<CreateAction>>({
    get: () => (isLegendary.value ? model.value.legendaryActions : model.value),
    set: (val) => {
      if (isLegendary.value) {
        model.value.legendaryActions = val;
      } else {
        model.value = val;
      }
    },
  });

  const legendaryCount = computed({
    get: () => model.value.legendaryActionCount,
    set: (val) => (model.value.legendaryActionCount = val),
  });

  const lairCount = computed({
    get: () => model.value.legendaryActionInLairCount,
    set: (val) => (model.value.legendaryActionInLairCount = val),
  });

  function isLastAction(index: number) {
    return index === actionsList.value.length - 1;
  }

  function addAction(indexOfNewFeature: number) {
    actionsList.value.splice(indexOfNewFeature, 0, getEmptyFeature());
  }

  function removeFeature(index: number) {
    actionsList.value.splice(index, 1);
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
          :name="['legendaryAction']"
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
          :name="['legendaryActionInLair']"
        >
          <AInputNumber
            v-model:value="lairCount"
            placeholder="Введи количество"
            min="1"
          />
        </AFormItem>
      </ACol>
    </ARow>
  </template>

  <template
    v-for="(action, actionIndex) in actionsList"
    :key="actionIndex"
  >
    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Название"
          :name="[
            name,
            ...(isLegendary ? ['legendaryActions'] : []),
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
            ...(isLegendary ? ['legendaryActions'] : []),
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
                @click.left.exact.prevent="removeFeature(actionIndex)"
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
            ...(isLegendary ? ['legendaryActions'] : []),
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
    v-if="!actionsList.length"
    justify="center"
  >
    <AButton @click.left.exact.prevent="addAction(0)">
      Добавить первое
    </AButton>
  </AFlex>
</template>
