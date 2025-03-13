<script setup lang="ts">
  import { SvgIcon } from '../icon';

  withDefaults(
    defineProps<{
      submit: () => void;
      isSubmitting?: boolean;
      disabled?: boolean;
    }>(),
    {
      isSubmitting: false,
      disabled: false,
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
      :disabled="disabled"
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
