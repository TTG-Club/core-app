<script setup lang="ts">
  interface LibraryOption {
    label: string;
    value: string;
  }

  const {
    options,
    placeholder = '',
    pickerPlaceholder = 'Из библиотеки',
  } = defineProps<{
    options: Array<LibraryOption>;
    placeholder?: string;
    pickerPlaceholder?: string;
  }>();

  const model = defineModel<string>({ default: '' });

  // Селект-выбор подставляет значение в поле и сбрасывается, чтобы оставаться
  // «вставкой из библиотеки», а не вторым источником истины.
  const pickerValue = ref<string | undefined>(undefined);

  function applyPicked(value: string | undefined) {
    if (typeof value === 'string') {
      model.value = value;
    }

    nextTick(() => {
      pickerValue.value = undefined;
    });
  }
</script>

<template>
  <div class="flex w-full gap-1">
    <UInput
      v-model="model"
      :placeholder="placeholder"
      class="flex-1 font-mono text-xs"
    />

    <USelectMenu
      v-model="pickerValue"
      :items="options"
      label-key="label"
      value-key="value"
      searchable
      :search-input="{ placeholder: 'Поиск…', icon: 'tabler:search' }"
      icon="tabler:books"
      :placeholder="pickerPlaceholder"
      :aria-label="pickerPlaceholder"
      class="w-10 shrink-0"
      :ui="{
        base: 'px-2 justify-center',
        content: 'min-w-96 max-w-[32rem]',
        item: 'whitespace-normal',
      }"
      @update:model-value="applyPicked"
    />
  </div>
</template>
