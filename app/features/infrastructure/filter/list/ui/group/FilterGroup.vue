<script setup lang="ts">
  import type {
    FilterGroup as FilterGroupType,
    FilterItem,
    FilterItems,
  } from '../../../types';

  import { getGroupItems, getSelectedItemIds } from '../../../utils';
  import { FilterGroupOptions } from '../options';
  import { FilterTag } from '../tag';

  type GroupPosition = 'standalone' | 'top' | 'bottom';

  const {
    items,
    collapsible = false,
    position = 'standalone',
  } = defineProps<{
    items: FilterItems;

    /** Сворачиваемая группа для узкой колонки: шапка-кнопка, значения под ней. */
    collapsible?: boolean;
    position?: GroupPosition;
  }>();

  const group = defineModel<FilterGroupType>({
    required: true,
  });

  // Классы бордера шапки: нижний блок не имеет скругления сверху
  const headerClass = computed(() => ({
    'rounded-t-xl': position !== 'bottom',
    'border border-default flex flex-wrap items-center justify-between gap-3 px-3 py-2': true,
  }));

  // Классы бордера тела: верхний блок не имеет скругления и нижней границы снизу
  const bodyClass = computed(() => ({
    'rounded-b-xl border-b': position !== 'top',
    'border-x border-default flex flex-wrap gap-3 px-3 py-4': true,
  }));

  /**
   * Сколько значений группы отмечено. Считаются все, а не только показанные:
   * счётчик на свёрнутой шапке говорит о том, что влияет на выдачу.
   */
  const selectedTotal = computed(() => getSelectedItemIds(group.value).length);

  const hasSelection = computed(() => selectedTotal.value > 0);

  const counterColor = computed(() => (group.value.mode ? 'error' : 'primary'));

  // Группа приходит одним пропом (defineModel), но мутировать её (или проп
  // items) напрямую нельзя. Любое изменение пересобирается иммутабельно и
  // эмитится наверх через defineModel — родитель обновляет filter.value.
  function handleItemSelect(
    itemId: FilterItem['id'],
    selected: boolean | null,
  ): void {
    const values = getGroupItems(group.value).map((filterItem) =>
      filterItem.id === itemId ? { ...filterItem, selected } : filterItem,
    );

    group.value = { ...group.value, values };
  }
</script>

<template>
  <!-- Группа с выбором раскрыта сразу: иначе отмеченное пряталось бы под -->
  <!-- шапкой. Дальше её состоянием управляет сам пользователь. -->
  <!-- Шапка группы — строка-заголовок: от названия к стрелке тянется тонкая -->
  <!-- линия, по ней видно, где начинается группа и её значения. -->
  <UCollapsible
    v-if="collapsible"
    :default-open="hasSelection"
    class="flex flex-col"
  >
    <UButton
      trailing-icon="tabler:chevron-down"
      color="neutral"
      variant="ghost"
      block
      class="group justify-between px-2"
      :ui="{
        trailingIcon:
          'transition-transform duration-200 group-data-[state=open]:rotate-180',
      }"
    >
      <span class="min-w-0 truncate text-left font-medium">
        {{ group.name }}
      </span>

      <span class="min-w-3 grow border-t border-default" />

      <UBadge
        v-if="hasSelection"
        :label="selectedTotal"
        :color="counterColor"
        variant="subtle"
        size="sm"
      />
    </UButton>

    <template #content>
      <div class="flex flex-col gap-3 px-2 pt-2 pb-3">
        <FilterGroupOptions
          v-model="group"
          :items
          size="md"
        />

        <div class="flex flex-wrap gap-2">
          <FilterTag
            v-for="filterItem in items"
            :key="`${filterItem.id}-${filterItem.name}`"
            :model-value="filterItem.selected"
            :exclude="group.mode"
            @update:model-value="handleItemSelect(filterItem.id, $event)"
          >
            {{ filterItem.name }}
          </FilterTag>
        </div>
      </div>
    </template>
  </UCollapsible>

  <div
    v-else
    class="flex flex-col"
  >
    <div :class="headerClass">
      <span class="font-medium">{{ group.name }}</span>

      <FilterGroupOptions
        v-model="group"
        :items
      />
    </div>

    <div :class="bodyClass">
      <FilterTag
        v-for="filterItem in items"
        :key="`${filterItem.id}-${filterItem.name}`"
        :model-value="filterItem.selected"
        :exclude="group.mode"
        @update:model-value="handleItemSelect(filterItem.id, $event)"
      >
        {{ filterItem.name }}
      </FilterTag>
    </div>
  </div>
</template>
