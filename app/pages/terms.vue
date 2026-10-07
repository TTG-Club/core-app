<script setup lang="ts">
  import {
    USER_AGREEMENT_INTRO,
    USER_AGREEMENT_PAGE_DESCRIPTION,
    USER_AGREEMENT_PAGE_SUBTITLE,
    USER_AGREEMENT_PAGE_TITLE,
    USER_AGREEMENT_SECTIONS,
    USER_AGREEMENT_UPDATED_AT,
    USER_AGREEMENT_UPDATED_PREFIX,
  } from '~infrastructure/user-agreement/model';
  import { LegalDocument } from '~ui/legal-document';

  useSeoMeta({
    title: USER_AGREEMENT_PAGE_TITLE,
    description: USER_AGREEMENT_PAGE_DESCRIPTION,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="USER_AGREEMENT_PAGE_TITLE"
    :subtitle="USER_AGREEMENT_PAGE_SUBTITLE"
  >
    <template #default>
      <LegalDocument
        :intro="USER_AGREEMENT_INTRO"
        :sections="USER_AGREEMENT_SECTIONS"
        :updated-at="USER_AGREEMENT_UPDATED_AT"
        :updated-prefix="USER_AGREEMENT_UPDATED_PREFIX"
      />
    </template>
  </NuxtLayout>
</template>
