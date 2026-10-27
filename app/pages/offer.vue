<script setup lang="ts">
  import {
    PUBLIC_OFFER_INTRO,
    PUBLIC_OFFER_PAGE_DESCRIPTION,
    PUBLIC_OFFER_PAGE_SUBTITLE,
    PUBLIC_OFFER_PAGE_TITLE,
    PUBLIC_OFFER_SECTIONS,
    PUBLIC_OFFER_UPDATED_AT,
    PUBLIC_OFFER_UPDATED_PREFIX,
  } from '~infrastructure/public-offer/model';
  import { LegalDocument } from '~ui/legal-document';

  useSeoMeta({
    title: PUBLIC_OFFER_PAGE_TITLE,
    description: PUBLIC_OFFER_PAGE_DESCRIPTION,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="PUBLIC_OFFER_PAGE_TITLE"
    :subtitle="PUBLIC_OFFER_PAGE_SUBTITLE"
  >
    <template #default>
      <LegalDocument
        :intro="PUBLIC_OFFER_INTRO"
        :sections="PUBLIC_OFFER_SECTIONS"
        :updated-at="PUBLIC_OFFER_UPDATED_AT"
        :updated-prefix="PUBLIC_OFFER_UPDATED_PREFIX"
      />
    </template>
  </NuxtLayout>
</template>
