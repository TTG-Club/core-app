<script setup lang="ts">
  import { cloneDeep } from 'lodash-es';

  import { FilterList } from '../list';

  import { Breakpoint, BREAKPOINTS } from '~/shared/composables';
  import { DrawerComponent } from '~ui/drawer';

  import type { Filter } from '../types';

  defineEmits<{
    (e: 'save', v: Filter): void;
    (e: 'reset'): void;
  }>();

  const { filter } = defineProps<{
    filter: Filter;
  }>();

  const opened = defineModel<boolean>();

  const cloned = ref<Filter>(filter);

  watch(opened, (value) => {
    if (!value) {
      return;
    }

    cloned.value = cloneDeep(filter);
  });
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
      <AFlex gap="8">
        <AButton
          type="primary"
          @click.left.exact.prevent="$emit('save', cloned)"
        >
          Применить
        </AButton>

        <AButton @click.left.exact.prevent="$emit('reset')"> Сбросить </AButton>
      </AFlex>
    </template>
  </DrawerComponent>
</template>
