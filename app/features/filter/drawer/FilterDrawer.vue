<script setup lang="ts">
  import { FilterList } from '../list';

  import { Breakpoint, BREAKPOINTS } from '~/shared/composables';
  import { DrawerComponent } from '~ui/drawer';

  import type { Filter } from '../types';

  const opened = defineModel<boolean>('opened');
  const filter = defineModel<Filter>({ required: true });

  const { cloned, sync } = useCloned(filter, {
    manual: true,
  });

  function saveFilter() {
    filter.value = cloned.value;
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
    <template #default>
      <FilterList v-model="cloned" />
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
