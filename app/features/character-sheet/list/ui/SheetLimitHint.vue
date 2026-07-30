<script setup lang="ts">
  import {
    SUBSCRIPTION_HINT_LINK_LABEL,
    SUBSCRIPTION_PROFILE_ROUTE,
  } from '../../model';

  defineProps<{
    /** Что именно даст подписка — текст со стороны раздела (у своих листов и
     * сохранённых лимиты разные). */
    text: string;
  }>();
</script>

<template>
  <p class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
    <UIcon
      name="tabler:sparkles"
      class="size-3.5 shrink-0"
    />

    <span>{{ text }}</span>

    <ULink
      :to="SUBSCRIPTION_PROFILE_ROUTE"
      class="text-primary"
    >
      {{ SUBSCRIPTION_HINT_LINK_LABEL }}
    </ULink>
  </p>
</template>
