<script setup lang="ts">
  import { VTTG_SUBSCRIPTION_LINK } from '../model';

  defineProps<{
    /** Что именно даст подписка — текст со стороны раздела, где упёрлись в лимит. */
    text: string;
  }>();
</script>

<template>
  <p class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
    <UIcon
      :name="VTTG_SUBSCRIPTION_LINK.icon"
      class="size-3.5 shrink-0 text-primary"
    />

    <span>{{ text }}</span>

    <ULink
      :to="VTTG_SUBSCRIPTION_LINK.to"
      class="font-medium text-primary"
    >
      {{ VTTG_SUBSCRIPTION_LINK.label }}
    </ULink>
  </p>
</template>
