<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { useTheme } from '~/shared/composables';

  const { theme, change } = useTheme();
</script>

<template>
  <LazyATooltip placement="right">
    <template #default>
      <AButton
        type="text"
        size="large"
        @click.left.exact.prevent="change"
      >
        <template #icon>
          <SvgIcon :icon="`theme/${theme}`" />
        </template>
      </AButton>
    </template>

    <template #title> Переключить тему сайта </template>
  </LazyATooltip>
</template>
