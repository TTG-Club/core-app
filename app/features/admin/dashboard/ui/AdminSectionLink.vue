<script setup lang="ts">
  import type { NavigationItem } from '~admin/navigation/model';

  import {
    ADMIN_DASHBOARD_CREATE_ICON,
    ADMIN_DASHBOARD_CREATE_LABEL,
  } from '../model';

  defineProps<{
    section: NavigationItem;
  }>();
</script>

<template>
  <div class="flex items-center gap-1">
    <UButton
      :to="section.to"
      :icon="section.icon"
      color="neutral"
      variant="ghost"
      block
      class="min-w-0 flex-1 justify-start"
      :ui="{ leadingIcon: 'text-muted', label: 'truncate' }"
    >
      {{ section.label }}
    </UButton>

    <UTooltip
      v-if="section.createRoute"
      :text="ADMIN_DASHBOARD_CREATE_LABEL"
    >
      <UButton
        :to="section.createRoute"
        :icon="ADMIN_DASHBOARD_CREATE_ICON"
        :aria-label="ADMIN_DASHBOARD_CREATE_LABEL"
        color="neutral"
        variant="ghost"
        square
      />
    </UTooltip>
  </div>
</template>
