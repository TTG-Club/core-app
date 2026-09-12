<script setup lang="ts">
  import {
    COOKIE_POLICY_INTRO,
    COOKIE_POLICY_PAGE_DESCRIPTION,
    COOKIE_POLICY_PAGE_SUBTITLE,
    COOKIE_POLICY_PAGE_TITLE,
    COOKIE_POLICY_SECTIONS,
    COOKIE_POLICY_UPDATED_AT,
    COOKIE_POLICY_UPDATED_PREFIX,
  } from '~infrastructure/cookie-consent/model';
  import { LegalDocument } from '~ui/legal-document';

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
      <LegalDocument
        :intro="COOKIE_POLICY_INTRO"
        :sections="COOKIE_POLICY_SECTIONS"
        :updated-at="COOKIE_POLICY_UPDATED_AT"
        :updated-prefix="COOKIE_POLICY_UPDATED_PREFIX"
      />
    </template>
  </NuxtLayout>
</template>
