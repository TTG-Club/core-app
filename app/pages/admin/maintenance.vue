<script setup lang="ts">
  import {
    MAINTENANCE_ADMIN_DEFAULT_SITE,
    MAINTENANCE_ADMIN_PAGE_HINT,
    MAINTENANCE_ADMIN_PAGE_TITLE,
    MAINTENANCE_ADMIN_SEO_TITLE,
    MAINTENANCE_ADMIN_SITE_TABS,
  } from '~admin/maintenance/model';
  import { MaintenanceSiteEditor } from '~admin/maintenance/ui';

  useSeoMeta({
    title: MAINTENANCE_ADMIN_SEO_TITLE,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="MAINTENANCE_ADMIN_PAGE_TITLE"
  >
    <div class="space-y-6">
      <p class="text-sm text-muted">
        {{ MAINTENANCE_ADMIN_PAGE_HINT }}
      </p>

      <!-- Формы сайтов не размонтируются: несохранённое не пропадает при
           переключении вкладки -->
      <UTabs
        :items="MAINTENANCE_ADMIN_SITE_TABS"
        :default-value="MAINTENANCE_ADMIN_DEFAULT_SITE"
        variant="link"
        :unmount-on-hide="false"
        :ui="{
          list: 'w-full',
          trigger: 'min-w-0 flex-1 px-2',
          label: 'whitespace-normal text-center',
          content: 'pt-6',
        }"
      >
        <template #content="{ item }">
          <MaintenanceSiteEditor :site="item" />
        </template>
      </UTabs>
    </div>
  </NuxtLayout>
</template>
