<script setup lang="ts">
  import { Role } from '~/shared/types';
  import {
    VTTG_DOCS_ADMIN_DEV_CHANNEL_LINK,
    VTTG_DOCS_ADMIN_OPEN_DEV_ICON,
    VTTG_DOCS_ADMIN_OPEN_DEV_LABEL,
    VTTG_DOCS_ADMIN_OPEN_ICON,
    VTTG_DOCS_ADMIN_OPEN_LABEL,
    VTTG_DOCS_ADMIN_PAGE_HINT,
    VTTG_DOCS_ADMIN_PAGE_TITLE,
    VTTG_DOCS_ADMIN_RELEASE_CHANNEL_LINK,
    VTTG_DOCS_ADMIN_SEO_TITLE,
  } from '~admin/vttg-docs/model';
  import { VttgDocsSettingsEditor } from '~admin/vttg-docs/ui';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: VTTG_DOCS_ADMIN_SEO_TITLE,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="VTTG_DOCS_ADMIN_PAGE_TITLE"
  >
    <div class="space-y-6">
      <p class="text-sm text-muted">
        {{ VTTG_DOCS_ADMIN_PAGE_HINT }}
      </p>

      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          :icon="VTTG_DOCS_ADMIN_OPEN_ICON"
          :label="VTTG_DOCS_ADMIN_OPEN_LABEL"
          :to="VTTG_DOCS_ADMIN_RELEASE_CHANNEL_LINK"
        />

        <UButton
          color="neutral"
          variant="subtle"
          :icon="VTTG_DOCS_ADMIN_OPEN_DEV_ICON"
          :label="VTTG_DOCS_ADMIN_OPEN_DEV_LABEL"
          :to="VTTG_DOCS_ADMIN_DEV_CHANNEL_LINK"
        />
      </div>

      <VttgDocsSettingsEditor />
    </div>
  </NuxtLayout>
</template>
