<script setup lang="ts" generic="Value extends string">
  /**
   * Селект с пунктом «не задано». `USelect` очистить выбор не даёт, а пустая
   * строка в нём зарезервирована и значением пункта быть не может — поэтому
   * «не задано» едет отдельным служебным значением, которое наружу выходит как
   * `undefined`.
   */
  const UNSET_VALUE = '__unset__';

  const { items, unsetLabel } = defineProps<{
    /** Значения поля; пункт «не задано» добавляется первым сам. */
    items: Array<{ label: string; value: Value }>;
    /** Подпись пункта «не задано»: у каждого поля она своя по смыслу. */
    unsetLabel: string;
  }>();

  const model = defineModel<Value | undefined>();

  const options = computed<Array<{ label: string; value: string }>>(() => [
    { label: unsetLabel, value: UNSET_VALUE },
    ...items,
  ]);

  /**
   * Выбранное значение ищем среди своих пунктов, а не сравниваем со служебным:
   * так значение возвращается уже сузившимся до `Value`, без приведения типов.
   */
  const selected = computed<string>({
    get: () => model.value ?? UNSET_VALUE,
    set: (value) => {
      model.value = items.find((option) => option.value === value)?.value;
    },
  });
</script>

<template>
  <USelect
    v-model="selected"
    :items="options"
  />
</template>
