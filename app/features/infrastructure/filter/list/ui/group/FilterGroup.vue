<script setup lang="ts">
  import type { FilterGroup as FilterGroupType } from '~infrastructure/filter/types';

  import { FilterTag } from '../tag';

  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

  const group = defineModel<FilterGroupType>({
    required: true,
  });

  const isVisible = computed(
    () =>
      !preview
      || (group.value.values || group.value.filters || []).some(
        (filter) => filter.selected !== null,
      ),
  );
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
        class="flex items-center justify-between rounded-t-xl border border-default px-3 py-2"
      >
        <span>{{ group.name }}</span>

        <div
          v-if="group.type === 'filter' && !preview"
          class="flex gap-4"
        >
          <UCheckbox
            v-if="group.supportsMode"
            v-model="group.mode"
            :true-value="1"
            :false-value="0"
            label="Исключать совпадения"
            size="xs"
            color="error"
          />

          <UCheckbox
            v-if="group.supportsUnion"
            v-model="group.union"
            :true-value="1"
            :false-value="0"
            label="Любое из (OR)"
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
          v-for="item in group.values || group.filters || []"
          :key="item.id + item.name"
          v-model="item.selected"
          :type="group.type"
          :preview
        >
          {{ item.name }}
        </FilterTag>
      </div>
    </div>
  </template>
</template>
