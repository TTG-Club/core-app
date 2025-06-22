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

  <UTooltip text="Закрыть">
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-ttg-x"
      @click="$emit('close')"
    />
  </UTooltip>
</template>
