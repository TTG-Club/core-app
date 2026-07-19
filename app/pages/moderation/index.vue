<script setup lang="ts">
  import {
    MODERATION_BUGS_ROUTE,
    MODERATION_COMMENTS_ROUTE,
    MODERATION_DASHBOARD_BUGS_DESCRIPTION,
    MODERATION_DASHBOARD_BUGS_TITLE,
    MODERATION_DASHBOARD_COMMENTS_DESCRIPTION,
    MODERATION_DASHBOARD_COMMENTS_TITLE,
    MODERATION_DASHBOARD_OPEN_LABEL,
    MODERATION_PANEL_TITLE,
  } from '~moderation/model';
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="MODERATION_PANEL_TITLE"
  >
    <div
      class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fit,minmax(360px,1fr))]"
    >
      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="truncate text-base text-highlighted">
              {{ MODERATION_DASHBOARD_BUGS_TITLE }}
            </h2>

            <UButton
              size="sm"
              :to="MODERATION_BUGS_ROUTE"
            >
              {{ MODERATION_DASHBOARD_OPEN_LABEL }}
            </UButton>
          </div>
        </template>

        <div class="text-sm text-muted">
          {{ MODERATION_DASHBOARD_BUGS_DESCRIPTION }}
        </div>
      </UCard>

      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="truncate text-base text-highlighted">
              {{ MODERATION_DASHBOARD_COMMENTS_TITLE }}
            </h2>

            <UButton
              size="sm"
              :to="MODERATION_COMMENTS_ROUTE"
            >
              {{ MODERATION_DASHBOARD_OPEN_LABEL }}
            </UButton>
          </div>
        </template>

        <div class="text-sm text-muted">
          {{ MODERATION_DASHBOARD_COMMENTS_DESCRIPTION }}
        </div>
      </UCard>
    </div>
  </NuxtLayout>
</template>
