<script setup lang="ts">
  import type { VttgDocsLoadFailure } from '../model';

  import { VTTG_DOCS_ROUTE } from '#shared/consts';
  import { UiResult } from '~ui/result';

  import {
    isVttgDocsRetryableFailure,
    VTTG_DOCS_ERROR_TITLE,
    VTTG_DOCS_FORBIDDEN_DESCRIPTION,
    VTTG_DOCS_FORBIDDEN_TITLE,
    VTTG_DOCS_HOME_LABEL,
    VTTG_DOCS_NOT_FOUND_DESCRIPTION,
    VTTG_DOCS_NOT_FOUND_TITLE,
    VTTG_DOCS_RETRY_LABEL,
  } from '../model';

  /** Заглушка вместо содержимого раздела: нет доступа, нет страницы, сбой. */
  const { failure } = defineProps<{
    failure: VttgDocsLoadFailure;
  }>();

  const emit = defineEmits<{
    retry: [];
  }>();

  /** Сбой сети или сервиса — его можно повторить. */
  const isRetryShown = computed(() => isVttgDocsRetryableFailure(failure));

  /** Что показать в заглушке. */
  interface LoadResultView {
    status: '403' | '404' | 'error';
    title: string;
    subTitle: string | undefined;
  }

  const failureView = computed<LoadResultView>(() => {
    switch (failure) {
      case 'forbidden':
        return {
          status: '403',
          title: VTTG_DOCS_FORBIDDEN_TITLE,
          subTitle: VTTG_DOCS_FORBIDDEN_DESCRIPTION,
        };
      case 'not-found':
        return {
          status: '404',
          title: VTTG_DOCS_NOT_FOUND_TITLE,
          subTitle: VTTG_DOCS_NOT_FOUND_DESCRIPTION,
        };
      default:
        return {
          status: 'error',
          title: VTTG_DOCS_ERROR_TITLE,
          subTitle: undefined,
        };
    }
  });
</script>

<template>
  <UiResult
    :status="failureView.status"
    :title="failureView.title"
    :sub-title="failureView.subTitle"
  >
    <template #extra>
      <UButton
        v-if="isRetryShown"
        @click.left.exact.prevent="emit('retry')"
      >
        {{ VTTG_DOCS_RETRY_LABEL }}
      </UButton>

      <UButton
        v-else
        color="neutral"
        variant="subtle"
        :to="VTTG_DOCS_ROUTE"
      >
        {{ VTTG_DOCS_HOME_LABEL }}
      </UButton>
    </template>
  </UiResult>
</template>
