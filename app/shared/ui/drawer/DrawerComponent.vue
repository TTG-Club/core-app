<script setup lang="ts">
  import {
    DrawerActions,
    DrawerBody,
    DrawerTitle,
    SourceTag,
  } from '~/shared/ui';
  import type { DrawerTitleName } from './types';
  import type { SourceResponse } from '~/shared/types';

  const { minWidth, maxWidth } = defineProps<{
    source?: SourceResponse;
    title: DrawerTitleName;
    isLoading?: boolean;
    isError?: boolean;
    minWidth?: number;
    maxWidth?: number;
    url?: string;
    width?: string;
  }>();

  const open = defineModel<boolean>('open');

  const contentWrapperStyle = computed(() => {
    if (!minWidth && !maxWidth) {
      return undefined;
    }

    return {
      minWidth: minWidth ? `${minWidth}px` : undefined,
      maxWidth: maxWidth ? `${maxWidth}px` : undefined,
    };
  });
</script>

<template>
  <ClientOnly>
    <ADrawer
      v-model:open="open"
      :content-wrapper-style="contentWrapperStyle"
      :closable="false"
      :width="width || 'auto'"
      destroy-on-close
      mask-closable
    >
      <template #title>
        <DrawerTitle :title="title" />
      </template>

      <template #extra>
        <AFlex
          align="flex-end"
          gap="8"
          vertical
        >
          <DrawerActions
            :url
            @close="open = false"
          />

          <SourceTag
            v-if="source"
            placement="bottomRight"
            :source
          />
        </AFlex>
      </template>

      <template #default>
        <DrawerBody
          :is-loading="isLoading"
          :is-error="isError"
        >
          <slot name="default" />
        </DrawerBody>
      </template>
    </ADrawer>
  </ClientOnly>
</template>
