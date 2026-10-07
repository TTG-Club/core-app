<script setup lang="ts">
  import type { LibraryOption } from './library-options';

  import { LIBRARY_PICKER_ICONS, LIBRARY_PICKER_LABELS } from './constants';
  import { buildLibraryMenuGroups } from './library-options';

  const {
    options,
    placeholder = '',
    pickerPlaceholder = LIBRARY_PICKER_LABELS.picker,
  } = defineProps<{
    /**
     * Строки библиотеки. С разделами (`section`) список делится заголовками, с
     * пояснениями (`hint`) под строкой появляется подсказка; без них — один
     * плоский список.
     */
    options: ReadonlyArray<LibraryOption>;
    placeholder?: string;
    pickerPlaceholder?: string;
  }>();

  const model = defineModel<string>({ default: '' });

  // Селект-выбор подставляет значение в поле и сбрасывается, чтобы оставаться
  // «вставкой из библиотеки», а не вторым источником истины.
  const pickerValue = ref<string | undefined>(undefined);

  const searchTerm = ref('');

  // Поиск свой, а не штатный: он идёт ещё и по пояснению, а повтор пояснения у
  // соседних строк прячется уже среди найденных.
  const menuGroups = computed(() =>
    buildLibraryMenuGroups(options, searchTerm.value),
  );

  /**
   * Подставляет выбранную строку библиотеки в поле и сбрасывает выбор.
   *
   * @param pickedValue значение выбранной строки.
   */
  function applyPicked(pickedValue: string | undefined) {
    if (typeof pickedValue === 'string') {
      model.value = pickedValue;
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
      v-model:search-term="searchTerm"
      :items="menuGroups"
      value-key="value"
      ignore-filter
      :search-input="{
        placeholder: LIBRARY_PICKER_LABELS.searchPlaceholder,
        icon: LIBRARY_PICKER_ICONS.search,
      }"
      :icon="LIBRARY_PICKER_ICONS.picker"
      :placeholder="pickerPlaceholder"
      :aria-label="pickerPlaceholder"
      class="w-10 shrink-0"
      :ui="{
        base: 'px-2 justify-center',
        content: 'min-w-96 max-w-lg max-h-96',
        item: 'whitespace-normal',
        itemLabel: 'text-clip whitespace-normal',
        itemDescription: 'text-clip whitespace-normal',
      }"
      @update:model-value="applyPicked"
    >
      <template #item-description="{ item: libraryRow }">
        <span class="block font-mono break-all">{{ libraryRow.value }}</span>

        <span
          v-if="libraryRow.description"
          class="block"
        >
          {{ libraryRow.description }}
        </span>
      </template>
    </USelectMenu>
  </div>
</template>
