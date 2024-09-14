<script setup lang="ts">
  const { theme, change } = useTheme();
</script>

<template>
  <ATooltip placement="right">
    <template #default>
      <AButton
        type="text"
        size="large"
        @click.left.exact.prevent="change"
      >
        <template #icon>
          <SvgIcon :name="`theme/${theme}`" />
        </template>
      </AButton>
    </template>

    <template #title> Переключить тему сайта </template>
  </ATooltip>
</template>
