<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';

  withDefaults(
    defineProps<{
      submit: () => void;
      isSubmitting?: boolean;
    }>(),
    {
      isSubmitting: false,
    },
  );
</script>

<template>
  <AFlex
    :class="$style.actions"
    :gap="16"
    justify="flex-end"
  >
    <AButton
      type="primary"
      :loading="isSubmitting"
      @click.left.exact.prevent="submit"
    >
      <template #icon>
        <SvgIcon icon="check" />
      </template>

      <template #default> Создать </template>
    </AButton>
  </AFlex>
</template>

<style module lang="scss">
  .actions {
    position: sticky;
    bottom: 0;
    padding: 16px;
  }
</style>
