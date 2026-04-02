<script setup lang="ts">
  import type { FilterGroup as FilterGroupType } from '~infrastructure/filter/types';

  import { getGroupItems } from '~infrastructure/filter/utils';

  import { FilterTag } from '../tag';

  type GroupPosition = 'standalone' | 'top' | 'bottom';

  const { preview = false, position = 'standalone' } = defineProps<{
    preview?: boolean;
    position?: GroupPosition;
  }>();

  // Используется defineModel — мутация group.mode / group.union через v-model
  // допустима, т.к. defineModel создаёт двустороннюю привязку и эмитит update
  const group = defineModel<FilterGroupType>({
    required: true,
  });

  const isVisible = computed(() => {
    if (!preview) {
      return true;
    }

    return getGroupItems(group.value).some(
      (filterItem) => filterItem.selected !== null,
    );
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
</script>

<template>
  <template v-if="isVisible">
    <div
      class="flex flex-col"
      :class="preview ? 'gap-2' : undefined"
    >
      <span v-if="preview">{{ group.name }}:</span>

      <div
        v-else
        :class="headerClass"
      >
        <span class="font-medium">{{ group.name }}</span>

        <div class="flex flex-wrap items-center gap-3">
          <UCheckbox
            v-if="group.supports?.mode"
            v-model="group.mode"
            label="Исключать"
            size="xs"
            color="error"
          />

          <UCheckbox
            v-if="group.supports?.union"
            v-model="group.union"
            label="Точное совпадение (AND)"
            size="xs"
          />
        </div>
      </div>

      <div
        v-if="!preview"
        :class="bodyClass"
      >
        <FilterTag
          v-for="item in getGroupItems(group)"
          :key="`${item.id}-${item.name}`"
          v-model="item.selected"
          :exclude="group.mode"
        >
          {{ item.name }}
        </FilterTag>
      </div>

      <div
        v-else
        class="flex flex-wrap gap-2"
      >
        <FilterTag
          v-for="item in getGroupItems(group)"
          :key="`${item.id}-${item.name}`"
          v-model="item.selected"
          preview
          :exclude="group.mode"
        >
          {{ item.name }}
        </FilterTag>
      </div>
    </div>
  </template>
</template>
