<script setup lang="ts">
  /**
   * Компонент главной навигации админ-панели.
   * Отображает список разделов с активным состоянием для текущего роута.
   * Использует динамические стили на основе активности роута.
   */

  import { useAdminNavigation } from './composables';
  import {
    ADMIN_PANEL_ICON,
    ADMIN_PANEL_TITLE,
    ADMIN_PANEL_UI_CONFIG,
  } from './model';

  const { items, isItemActive, getItemColor, getItemVariant } =
    useAdminNavigation();
</script>

<template>
  <div
    :class="[
      'flex h-full flex-col border-r border-default',
      ADMIN_PANEL_UI_CONFIG.navigationWidth,
      ADMIN_PANEL_UI_CONFIG.containerPadding,
    ]"
  >
    <div
      :class="[
        'flex items-center gap-2',
        ADMIN_PANEL_UI_CONFIG.headerGap,
        ADMIN_PANEL_UI_CONFIG.headerPadding,
      ]"
    >
      <UIcon
        :name="ADMIN_PANEL_ICON"
        :class="[ADMIN_PANEL_UI_CONFIG.iconSize, 'text-primary']"
      />

      <span class="text-lg font-bold">{{ ADMIN_PANEL_TITLE }}</span>
    </div>

    <nav
      :class="['flex flex-col', ADMIN_PANEL_UI_CONFIG.navGap]"
      aria-label="Навигация админ-панели"
    >
      <UButton
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :icon="item.icon"
        :color="getItemColor(item)"
        :variant="getItemVariant(item)"
        :aria-current="isItemActive(item) ? 'page' : undefined"
        class="justify-start"
      >
        {{ item.label }}
      </UButton>
    </nav>
  </div>
</template>
