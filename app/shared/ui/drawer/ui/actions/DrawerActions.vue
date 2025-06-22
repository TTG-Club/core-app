<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';
  import { CopyButton } from '~ui/copy-button';

  defineEmits<{
    (e: 'close'): void;
  }>();

  defineProps<{
    url?: string;
    editUrl?: string;
  }>();

  const { isAdmin } = storeToRefs(useUserStore());
</script>

<template>
  <UTooltip
    v-if="editUrl && isAdmin"
    text="Редактировать"
  >
    <UButton
      :href="editUrl"
      variant="ghost"
      target="_blank"
      color="neutral"
      icon="i-ttg-edit"
      size="sm"
    />
  </UTooltip>

  <UTooltip text="Открыть в новой вкладке">
    <UButton
      v-if="url"
      :href="url"
      variant="ghost"
      target="_blank"
      color="neutral"
      icon="i-ttg-new-page"
      size="sm"
    />
  </UTooltip>

  <CopyButton
    v-if="url"
    :url
    size="sm"
  />

  <UButton
    variant="ghost"
    color="neutral"
    icon="i-ttg-x"
    size="sm"
    @click.left.exact.prevent="$emit('close')"
  />
</template>
