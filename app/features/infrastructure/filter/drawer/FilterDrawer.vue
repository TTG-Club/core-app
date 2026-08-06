<script setup lang="ts">
  import type { FilterGroups } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { FilterList } from '../list';
  import { isFilterSearchable } from '../utils';

  defineEmits<{
    (event: 'save', value: FilterGroups): void;
    (event: 'reset'): void;
  }>();

  const { groups, title } = defineProps<{
    groups: FilterGroups;
    title: string;
  }>();

  const opened = defineModel<boolean>();

  const cloned = ref<FilterGroups>(cloneDeep(groups));
  const search = ref('');

  const isSearchable = computed(() => isFilterSearchable(groups));

  watch(opened, (value) => {
    if (!value) {
      return;
    }

    cloned.value = cloneDeep(groups);
    // Поиск — способ навигации по списку, а не часть состояния фильтра: забытый запрос показал бы при следующем открытии треть групп без видимой причины.
    search.value = '';
  });
</script>

<template>
  <USlideover
    v-model:open="opened"
    :title
    :ui="{
      content: 'w-full max-w-192 min-w-80',
    }"
  >
    <template #body>
      <!-- Блок растянут на padding скроллящегося body во все стороны: иначе содержимое просвечивало бы над прилипшим полем и по бокам. Пары «отрицательный отступ + padding» гасят друг друга в покое и дают фон, когда блок прилипает; `top` тянет ровно на тот же padding, чтобы поле встало вплотную к краю. Отступы вокруг поля равны gap-6 списка. -->
      <div
        v-if="isSearchable"
        class="sticky -top-4 z-10 -mx-4 -mt-4 bg-default px-4 pt-4 pb-6 sm:-top-6 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6"
      >
        <UInput
          v-model="search"
          placeholder="Поиск по фильтрам..."
          icon="tabler:search"
          allow-clear
        />
      </div>

      <FilterList
        v-model="cloned"
        :search
      />
    </template>

    <template #footer>
      <div class="flex gap-2">
        <UButton @click.left.exact.prevent="$emit('save', cloned)">
          Применить
        </UButton>

        <UButton
          variant="ghost"
          color="error"
          trailing-icon="tabler:trash"
          @click.left.exact.prevent="$emit('reset')"
        >
          Сбросить
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
