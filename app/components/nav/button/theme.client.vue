<script setup lang="ts">
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
