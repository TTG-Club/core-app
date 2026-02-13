<script setup lang="ts">
  import { ClassBody } from '~classes/body';
  import { UiDrawer } from '~ui/drawer';

  import type { ClassCreate, ClassDetailResponse } from '~classes/model';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: ClassCreate;
  }>();

  const {
    data: characterClass,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<ClassDetailResponse>(`/api/v2/classes/preview`, {
        method: 'post',
        body: state,
      }),
    {
      lazy: true,
      server: false,
      immediate: false,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');

  whenever(opened, () => {
    clear();
    loadPreview();
  });
</script>

<template>
  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="characterClass?.name"
    :source="characterClass?.source"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <ClassBody
      v-if="characterClass"
      :detail="characterClass"
      in-drawer
    />
  </UiDrawer>
</template>
