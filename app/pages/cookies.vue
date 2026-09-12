<script setup lang="ts">
  import {
    COOKIE_POLICY_PAGE_DESCRIPTION,
    COOKIE_POLICY_PAGE_SUBTITLE,
    COOKIE_POLICY_PAGE_TITLE,
  } from '~infrastructure/cookie-consent/model';
  import { CookiePolicyBody } from '~infrastructure/cookie-consent/policy';

  useSeoMeta({
    title: COOKIE_POLICY_PAGE_TITLE,
    description: COOKIE_POLICY_PAGE_DESCRIPTION,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="COOKIE_POLICY_PAGE_TITLE"
    :subtitle="COOKIE_POLICY_PAGE_SUBTITLE"
  >
    <template #default>
      <CookiePolicyBody />
    </template>
  </NuxtLayout>
</template>
