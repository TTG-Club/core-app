<script setup lang="ts">
  import {
    PRIVACY_POLICY_INTRO,
    PRIVACY_POLICY_PAGE_DESCRIPTION,
    PRIVACY_POLICY_PAGE_SUBTITLE,
    PRIVACY_POLICY_PAGE_TITLE,
    PRIVACY_POLICY_SECTIONS,
    PRIVACY_POLICY_UPDATED_AT,
    PRIVACY_POLICY_UPDATED_PREFIX,
  } from '~infrastructure/privacy-policy/model';
  import { LegalDocument } from '~ui/legal-document';

  useSeoMeta({
    title: PRIVACY_POLICY_PAGE_TITLE,
    description: PRIVACY_POLICY_PAGE_DESCRIPTION,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="PRIVACY_POLICY_PAGE_TITLE"
    :subtitle="PRIVACY_POLICY_PAGE_SUBTITLE"
  >
    <template #default>
      <LegalDocument
        :intro="PRIVACY_POLICY_INTRO"
        :sections="PRIVACY_POLICY_SECTIONS"
        :updated-at="PRIVACY_POLICY_UPDATED_AT"
        :updated-prefix="PRIVACY_POLICY_UPDATED_PREFIX"
      />
    </template>
  </NuxtLayout>
</template>
