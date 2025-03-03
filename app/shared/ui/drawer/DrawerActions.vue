<script setup lang="ts">
  import { CopyButton } from '../copy-button';
  import { SvgIcon } from '~/shared/ui';

  defineProps<{
    url?: string;
  }>();
</script>

<template>
  <AFlex
    :gap="8"
    justify="flex-end"
  >
    <CopyButton
      v-if="url"
      :url
      size="small"
    />

    <ATooltip title="Закладка">
      <AButton
        size="small"
        type="text"
        disabled
      >
        <template #icon>
          <SvgIcon icon="bookmark/outline" />
        </template>
      </AButton>
    </ATooltip>
  </AFlex>
</template>
