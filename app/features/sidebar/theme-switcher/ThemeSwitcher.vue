<script setup lang="ts">
  import { ThemeName } from '~/shared/consts';

  import type { DropdownMenuItem } from '@nuxt/ui';

  const { name, change } = useTheme();
  const { greaterOrEqual } = useBreakpoints();

  const opened = ref(false);
  const isMenuOnLeft = greaterOrEqual(Breakpoint.MD);

  const side = computed(() => (isMenuOnLeft.value ? 'right' : 'top'));

  const items = computed<DropdownMenuItem[]>(() => [
    {
      label: 'Светлая',
      checked: name.value === ThemeName.Light,
      type: 'checkbox',
      onSelect: (e: Event) => {
        e.preventDefault();
        change(ThemeName.Light);
      },
    },
    {
      label: 'Темная',
      checked: name.value === ThemeName.Dark,
      type: 'checkbox',
      onSelect: (e: Event) => {
        e.preventDefault();
        change(ThemeName.Dark);
      },
    },
    {
      label: 'svifty7',
      checked: name.value === ThemeName.svifty7,
      type: 'checkbox',
      onSelect: (e: Event) => {
        e.preventDefault();
        change(ThemeName.svifty7);
      },
    },
  ]);
</script>

<template>
  <UDropdownMenu
    v-model:open="opened"
    :content="{ side }"
    :items
  >
    <UButton
      variant="ghost"
      size="xl"
      icon="i-ttg-settings"
      color="neutral"
    />
  </UDropdownMenu>
</template>
