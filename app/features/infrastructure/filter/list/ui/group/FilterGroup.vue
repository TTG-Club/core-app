<script setup lang="ts">
  import type { FilterGroup as FilterGroupType } from '~infrastructure/filter/types';

  import { getGroupItems } from '~infrastructure/filter/utils';

  import { FilterTag } from '../tag';

  const { preview = false } = defineProps<{
    preview?: boolean;
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
      (filter) => filter.selected !== null,
    );
  });
</script>

<template>
  <template v-if="isVisible">
    <div
      class="flex flex-col"
      :class="!preview ? 'gap-0' : 'gap-2'"
    >
      <span v-if="preview">{{ group.name }}:</span>

      <div
        v-else
        class="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border border-default px-3 py-2"
      >
        <span class="font-medium">{{ group.name }}</span>

        <div
          v-if="!preview"
          class="flex flex-wrap items-center gap-3"
        >
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
        class="flex flex-wrap"
        :class="
          !preview
            ? 'gap-3 rounded-b-xl border-x border-b border-default px-3 py-4'
            : 'gap-2'
        "
      >
        <FilterTag
          v-for="item in getGroupItems(group)"
          :key="`${item.id}-${item.name}`"
          v-model="item.selected"
          :preview
          :exclude="group.mode"
        >
          {{ item.name }}
        </FilterTag>
      </div>
    </div>
  </template>
</template>
