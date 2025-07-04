<script setup lang="ts">
  import { computed } from 'vue';

  import { ValidationBase } from '~/shared/utils';

  import type { LegendaryActions, CreateAction } from '~bestiary/types';

  const model = defineModel<LegendaryActions>({ required: true });

  const actions = computed(() => model.value.actions);

  const legendaryCount = computed({
    get: () => model.value.count ?? 0,
    set: (val) => (model.value.count = val),
  });

  const lairCount = computed({
    get: () => model.value.inLair ?? 0,
    set: (val) => (model.value.inLair = val),
  });

  const legendaryDescription = computed({
    get: () => model.value.description ?? '',
    set: (val) => (model.value.description = val),
  });

  function getEmptyFeature(): CreateAction {
    return {
      name: { rus: '', eng: '' },
      description: '',
      attackType: '',
      savingThrows: [],
      damageTypes: [],
      recharge: undefined,
      restrictionOfUse: undefined,
    };
  }

  function isLastAction(index: number) {
    return index === actions.value.length - 1;
  }

  function addAction(index: number) {
    actions.value.splice(index, 0, getEmptyFeature());
  }

  function removeAction(index: number) {
    actions.value.splice(index, 1);
  }
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      strong
    >
      Легендарные действия
    </ATypographyText>
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="12">
      <AFormItem
        label="Количество легендарных действий"
        :name="['legendary', 'count']"
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
        :name="['legendary', 'inLair']"
      >
        <AInputNumber
          v-model:value="lairCount"
          placeholder="Введи количество"
          min="1"
        />
      </AFormItem>
    </ACol>
  </ARow>

  <AFormItem
    label="Описание легендарных действий"
    :name="['legendary', 'description']"
  >
    <ATextarea
      v-model:value="legendaryDescription"
      :auto-size="{ minRows: 2, maxRows: 6 }"
      placeholder="Введите описание (необязательно)"
    />
  </AFormItem>

  <template
    v-for="(action, index) in actions"
    :key="index"
  >
    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Название"
          :name="['legendary', 'actions', index, 'name', 'rus']"
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
          :name="['legendary', 'actions', index, 'name', 'eng']"
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
          <ARow :gutter="8">
            <ACol :span="12">
              <AButton
                block
                @click.left.exact.prevent="addAction(index + 1)"
              >
                Добавить
              </AButton>
            </ACol>

            <ACol :span="12">
              <AButton
                danger
                block
                @click.left.exact.prevent="removeAction(index)"
              >
                Удалить
              </AButton>
            </ACol>
          </ARow>
        </AFormItem>
      </ACol>
    </ARow>

    <AFormItem
      label="Описание"
      :name="['legendary', 'actions', index, 'description']"
      :rules="[ValidationBase.ruleString()]"
    >
      <ATextarea
        v-model:value="action.description"
        :auto-size="{ minRows: 3, maxRows: 8 }"
        placeholder="Введи описание"
      />
    </AFormItem>

    <ADivider v-if="!isLastAction(index)" />
  </template>

  <AFlex
    v-if="!actions.length"
    justify="center"
  >
    <AButton @click.left.exact.prevent="addAction(0)">Добавить первое</AButton>
  </AFlex>
</template>
