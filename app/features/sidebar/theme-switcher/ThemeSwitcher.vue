<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { useTheme } from '~/shared/composables';
  import { SidebarPopover } from '../popover';

  const { change } = useTheme();
</script>

<template>
  <SidebarPopover popover-key="theme-switcher">
    <template #trigger="{ toggle }">
      <AButton
        type="text"
        size="large"
        @click.left.exact.prevent="toggle"
      >
        <template #icon>
          <SvgIcon icon="dice/outline/d20" />
        </template>
      </AButton>
    </template>

    <template #default>
      <AFlex gap="8">
        <AButton @click="change('light')"> light </AButton>

        <AButton @click="change('dark')"> dark </AButton>
      </AFlex>
    </template>
  </SidebarPopover>
</template>
