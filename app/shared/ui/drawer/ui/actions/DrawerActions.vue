<script setup lang="ts">
  import { CopyButton } from '~ui/copy-button';

  import { useUserStore } from '~/shared/stores';

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
      v-if="editUrl"
      :href="editUrl"
      variant="ghost"
      target="_blank"
      color="neutral"
      icon="i-ttg-edit"
      size="sm"
    />
  </UTooltip>

  <UTooltip
    v-if="url"
    text="Открыть в новой вкладке"
  >
    <UButton
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
