<script setup lang="ts">
  import type { NavigationGroup } from '~admin/navigation/model';

  import AdminDashboardPanel from './AdminDashboardPanel.vue';
  import AdminSectionLink from './AdminSectionLink.vue';

  defineProps<{
    group: NavigationGroup;
  }>();

  defineSlots<{
    /** Строки управления под ссылками группы: например, выключатель оплаты */
    default?: () => unknown;
  }>();
</script>

<template>
  <AdminDashboardPanel
    :title="group.title"
    :icon="group.icon"
  >
    <nav
      class="flex flex-col gap-0.5 p-1.5"
      :aria-label="group.title"
    >
      <AdminSectionLink
        v-for="groupSection in group.items"
        :key="groupSection.to"
        :section="groupSection"
      />

      <slot />
    </nav>
  </AdminDashboardPanel>
</template>
