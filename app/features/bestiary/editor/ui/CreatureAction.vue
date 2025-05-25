<script setup lang="ts">
  import { ValidationBase } from '~/shared/utils';

  import type { CreateAction } from '~bestiary/types';

  type ActionKey =
    | 'actions'
    | 'bonusActions'
    | 'reactions'
    | 'legendaryActions';

  const props = defineProps<{
    name: ActionKey;
  }>();

  const labelMap: Record<ActionKey, string> = {
    actions: 'Действия',
    bonusActions: 'Бонусные действия',
    reactions: 'Реакции',
    legendaryActions: 'Легендарные действия',
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
      recharge: '',
      restrictionOfUse: '',
    };
  }

  const model = defineModel<Array<CreateAction>>({
    default: () => [],
  });

  function isLastAction(index: number) {
    return index === model.value.length - 1;
  }

  function addAction(indexOfNewFeature: number) {
    model.value.splice(indexOfNewFeature, 0, getEmptyFeature());
  }

  function removeFeature(index: number) {
    model.value.splice(index, 1);
  }
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      :content="labelMap[props.name] ?? 'Особенности'"
      type="secondary"
      strong
    />
  </ADivider>

  <template
    v-for="(action, actionIndex) in model"
    :key="actionIndex"
  >
    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Название"
          :name="[props.name, actionIndex, 'name', 'rus']"
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
          :name="[props.name, actionIndex, 'name', 'eng']"
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
          :name="[props.name, actionIndex, 'description']"
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
