<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS } from '~/shared/composables';
  import { CreatureBody } from '~bestiary/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { CreatureCreate, CreatureDetailResponse } from '~bestiary/types';

  const opened = defineModel<boolean>({ required: true });

  const { form } = defineProps<{
    form: CreatureCreate;
  }>();

  const {
    data: creature,
    status,
    execute,
    clear,
  } = await useFetch<CreatureDetailResponse>(() => `/api/v2/bestiary/preview`, {
    method: 'POST',
    body: computed(() => form),
    server: false,
    immediate: false,
  });

  watch(opened, (value) => {
    if (!value) {
      return;
    }

    clear();
    execute();
  });
</script>

<template>
  <DrawerComponent
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="creature?.name"
    :source="creature?.source"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
  >
    <CreatureBody
      v-if="creature"
      :creature
    />
  </DrawerComponent>
</template>
