<script setup lang="ts">
  import { CopyButton } from '../../copy-button';

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
      :href="editUrl"
      variant="ghost"
      target="_blank"
      color="neutral"
      icon="i-ttg-edit"
      size="sm"
    />
  </UTooltip>

  <UButton
    v-if="url"
    :href="url"
    variant="ghost"
    target="_blank"
    color="neutral"
    icon="i-ttg-new-page"
    size="sm"
  />

  <CopyButton
    v-if="url"
    :url
    size="sm"
  />

  <UTooltip
    v-if="url"
    text="Закладка"
  >
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-fluent-bookmark-16-regular"
      size="sm"
      disabled
    />
  </UTooltip>

  <UButton
    variant="ghost"
    color="neutral"
    icon="i-ttg-x"
    size="sm"
    @click.left.exact.prevent="$emit('close')"
  />
</template>
