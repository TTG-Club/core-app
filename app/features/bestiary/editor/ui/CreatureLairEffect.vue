<script setup lang="ts">
  import { computed } from 'vue';

  import { ValidationBase } from '~/shared/utils';

  import type { CreateAction, CreatureLair } from '~bestiary/types';

  const model = defineModel<CreatureLair>({ required: true });

  const actions = computed(() => model.value.effects);

  const description = computed({
    get: () => model.value.description ?? '',
    set: (val) => (model.value.description = val),
  });

  function getEmptyFeature(): CreateAction {
    return {
      name: { rus: '', eng: '' },
      description: '',
      attackType: '',
      sawingThrows: [],
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
      Логово
    </ATypographyText>
  </ADivider>

  <AFormItem
    label="Описание логова"
    :name="['lair', 'description']"
  >
    <ATextarea
      v-model:value="description"
      :auto-size="{ minRows: 2, maxRows: 6 }"
      placeholder="Введите описание"
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
          :name="['lair', 'effects', index, 'name', 'rus']"
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
          :name="['lair', 'effects', index, 'name', 'eng']"
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
                >Добавить</AButton
              >
            </ACol>

            <ACol :span="12">
              <AButton
                danger
                block
                @click.left.exact.prevent="removeAction(index)"
                >Удалить</AButton
              >
            </ACol>
          </ARow>
        </AFormItem>
      </ACol>
    </ARow>

    <AFormItem
      label="Описание"
      :name="['lair', 'effects', index, 'description']"
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
