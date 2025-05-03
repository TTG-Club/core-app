<script setup lang="ts">
  import { cloneDeep } from 'lodash-es';

  import { FilterTag } from '../tag';

  import { Breakpoint, BREAKPOINTS } from '~/shared/composables';
  import { DrawerComponent } from '~ui/drawer';

  import type { Filter } from '../types';

  const opened = defineModel<boolean>('opened');
  const filter = defineModel<Filter>({ required: true });

  const { cloned, sync } = useCloned(filter, {
    manual: true,
    deep: true,
  });

  function saveFilter() {
    filter.value = cloneDeep(cloned.value);
    opened.value = false;
  }

  watch(
    opened,
    (value) => {
      if (!value) {
        return;
      }

      sync();
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <DrawerComponent
    v-model:open="opened"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :min-width="320"
    width="100%"
    title="Фильтры"
  >
    <template
      v-for="group in cloned.groups"
      :key="group.key + group.name"
    >
      <ADivider orientation="left">
        {{ group.name }}
      </ADivider>

      <AFlex
        wrap="wrap"
        gap="12"
      >
        <FilterTag
          v-for="item in group.filters"
          :key="item.key + item.name"
          v-model="item.selected"
        >
          {{ item.name }}
        </FilterTag>
      </AFlex>
    </template>

    <template #footer>
      <AButton
        type="primary"
        @click.left.exact.prevent="saveFilter"
      >
        apply
      </AButton>
    </template>
  </DrawerComponent>
</template>
