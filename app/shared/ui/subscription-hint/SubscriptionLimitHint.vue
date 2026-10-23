<script setup lang="ts">
  import {
    SUBSCRIPTION_LIMIT_HINT,
    SUBSCRIPTION_PAGE_PATH,
  } from '~/shared/consts';

  defineProps<{
    /** Что именно даст подписка — текст раздела, у каждого свои лимиты. */
    text: string;
  }>();
</script>

<template>
  <p class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
    <UIcon
      :name="SUBSCRIPTION_LIMIT_HINT.icon"
      class="size-3.5 shrink-0 text-primary"
    />

    <span>{{ text }}</span>

    <ULink
      :to="SUBSCRIPTION_PAGE_PATH"
      class="text-primary"
    >
      {{ SUBSCRIPTION_LIMIT_HINT.linkLabel }}
    </ULink>
  </p>
</template>
