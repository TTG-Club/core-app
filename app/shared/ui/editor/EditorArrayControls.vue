<script setup lang="ts" generic="T extends object">
  import { cloneDeep, isEqual } from 'lodash-es';

  const model = defineModel<Array<T>>({ required: true });

  const {
    emptyObject,
    item,
    index,
    cols = 6,
  } = defineProps<{
    item: T;
    emptyObject: T;
    index: number;
    onlyRemove?: boolean;
    cols?: number | `${number}`;
  }>();

  const isEmpty = computed(() => isEqual(item, emptyObject));
  const isLast = computed(() => index === model.value.length - 1);
  const colsClass = computed(() => `col-span-${cols}`);

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
  <UFormField
    label="Управление"
    :class="colsClass"
  >
    <div class="flex gap-2">
      <UButton
        variant="subtle"
        block
        @click.left.exact.prevent="add"
      >
        Добавить
      </UButton>

      <UButton
        v-if="isLast && !onlyRemove"
        :disabled="isEmpty"
        variant="subtle"
        color="error"
        block
        @click.left.exact.prevent="clear"
      >
        Очистить
      </UButton>

      <UButton
        v-else
        variant="subtle"
        color="error"
        block
        @click.left.exact.prevent="remove"
      >
        Удалить
      </UButton>
    </div>
  </UFormField>
</template>
