<script setup lang="ts">
  import type { CreatureSizes } from '~bestiary/model';

  import { SelectSize } from '~ui/select';

  const model = defineModel<CreatureSizes>({
    required: true,
  });

  // Стандартный и нестандартный размеры исключают друг друга: заполнение одного
  // очищает второй. Встречная пара вотчеров не зацикливается, потому что каждый
  // очищает соседнее поле только когда собственное заполнено: после очистки оно
  // пустое, и ответное срабатывание сразу выходит по guard'у. Раньше вотчеры
  // сравнивали старое и новое значения — очистка соседа выглядела как правка, и
  // цикл возвращался, стирая только что введённый нестандартный размер.
  //
  // Сравнение `toRaw(model.value)` отсекает загрузку записи: форма подменяет
  // объект модели целиком, и без проверки загруженный размер стирался сам.
  watchDebounced(
    [
      () => toRaw(model.value),
      () => model.value.values,
      () => model.value.text,
    ],
    ([nextSizes, values, text], [previousSizes]) => {
      if (nextSizes !== previousSizes || (!values.length && !text)) {
        return;
      }

      model.value.sizeString = undefined;
    },
    { debounce: 300 },
  );

  watchDebounced(
    [() => toRaw(model.value), () => model.value.sizeString],
    ([nextSizes, sizeString], [previousSizes]) => {
      if (nextSizes !== previousSizes || !sizeString) {
        return;
      }

      model.value.values = [];
      model.value.text = undefined;
    },
    { debounce: 300 },
  );
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-1 gap-4 md:col-span-18 md:grid-cols-24"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-full md:col-span-8"
      label="Размеры существа"
      name="values"
    >
      <SelectSize
        v-model="model.values"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-8"
      label="Уточнение размера"
      name="text"
    >
      <UInput
        v-model="model.text"
        placeholder="Введи уточнение размера"
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-8"
      label="Нестандартный размер"
      name="sizeString"
    >
      <UInput
        v-model="model.sizeString"
        placeholder="Введи нестандартный размер"
      />
    </UFormField>
  </UForm>
</template>
