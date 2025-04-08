<script setup lang="ts">
  import { SourceTag } from '../../source-tag';
  import { DrawerActions } from '../actions';
  import { DrawerBody } from '../body';
  import { DrawerTitle, type DrawerTitleName } from '../title';

  import type { SourceResponse } from '~/shared/types';

  const {
    minWidth,
    maxWidth,
    copyTitle = false,
  } = defineProps<{
    source?: SourceResponse;
    title: DrawerTitleName;
    isLoading?: boolean;
    isError?: boolean;
    minWidth?: number;
    maxWidth?: number;
    url?: string;
    width?: string;
    copyTitle?: boolean;
  }>();

  const open = defineModel<boolean>('open', {
    default: false,
  });

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
  <ADrawer
    v-model:open="open"
    :content-wrapper-style="contentWrapperStyle"
    :closable="false"
    :width="width || 'auto'"
    destroy-on-close
    mask-closable
  >
    <template #title>
      <DrawerTitle
        :copy-title="copyTitle"
        :title="title"
      />
    </template>

    <template #extra>
      <AFlex
        justify="flex-start"
        align="flex-end"
        gap="8"
        vertical
      >
        <DrawerActions
          :url
          @close="open = false"
        />

        <Transition
          name="fade"
          mode="out-in"
        >
          <SourceTag
            v-if="source"
            placement="bottomRight"
            :source
          />
        </Transition>
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
</template>
