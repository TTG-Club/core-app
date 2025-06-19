<script setup lang="ts">
  import { CopyButton } from '../copy-button';

  import { useUserStore } from '~/shared/stores';

  defineProps<{
    editUrl?: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const route = useRoute();
  const { isAdmin } = storeToRefs(useUserStore());

  const urlForCopy = computed(() => {
    return getOrigin() + route.path;
  });

  function openPrintWindow() {
    window.print();

    // sendShareMetrics({
    //   method: 'page_print',
    //   id: route.path,
    // });
  }
</script>

<template>
  <UTooltip
    v-if="editUrl && isAdmin"
    text="Редактировать"
  >
    <UButton
      :href="editUrl"
      icon="i-ttg-edit"
      variant="ghost"
      target="_blank"
      color="neutral"
      no-rel
    />
  </UTooltip>

  <CopyButton :url="urlForCopy" />

  <UTooltip text="Закладка">
    <UButton
      icon="i-fluent-bookmark-16-regular"
      variant="ghost"
      color="neutral"
      disabled
    />
  </UTooltip>

  <UTooltip text="Открыть окно печати">
    <UButton
      icon="i-ttg-print"
      variant="ghost"
      color="neutral"
      disabled
      @click="openPrintWindow"
    />
  </UTooltip>

  <UTooltip text="Закрыть">
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-ttg-x"
      @click="$emit('close')"
    />
  </UTooltip>
</template>
