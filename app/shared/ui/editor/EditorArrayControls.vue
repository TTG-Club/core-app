<script setup lang="ts" generic="T extends object">
  import { cloneDeep, isEqual } from 'lodash-es';

  const model = defineModel<Array<T>>({ required: true });

  const { emptyObject, item, index } = defineProps<{
    item: T;
    emptyObject: T;
    index: number;
    onlyRemove?: boolean;
  }>();

  const isEmpty = computed(() => isEqual(item, emptyObject));
  const isLast = computed(() => index === model.value.length - 1);

  function add() {
    model.value.splice(index + 1, 0, getEmpty());
  }

  function clear() {
    model.value.splice(index, 1, getEmpty());
  }

  function remove() {
    model.value.splice(index, 1);
  }

  function getEmpty() {
    return cloneDeep(emptyObject);
  }
</script>

<template>
  <ACol :span="6">
    <AFormItem label="Управление">
      <AFlex :gap="8">
        <AButton
          block
          @click.left.exact.prevent="add"
        >
          Добавить
        </AButton>

        <AButton
          v-if="isLast && !onlyRemove"
          :disabled="isEmpty"
          danger
          block
          @click.left.exact.prevent="clear"
        >
          Очистить
        </AButton>

        <AButton
          v-else
          danger
          block
          @click.left.exact.prevent="remove"
        >
          Удалить
        </AButton>
      </AFlex>
    </AFormItem>
  </ACol>
</template>
