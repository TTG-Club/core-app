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
  <UFieldGroup class="w-full">
    <UButton
      :to="section.to"
      :icon="section.icon"
      color="neutral"
      variant="subtle"
      size="lg"
      block
      class="justify-start"
      :ui="{ leadingIcon: 'text-primary', label: 'truncate' }"
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
        variant="subtle"
        size="lg"
        square
      />
    </UTooltip>
  </UFieldGroup>
</template>
