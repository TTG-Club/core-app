<script setup lang="ts">
  import {
    ADMIN_DASHBOARD_EMPTY_VALUE,
    ADMIN_DASHBOARD_NUMBER_FORMAT,
  } from '~admin/dashboard/model';
  import { AdminStatTile } from '~admin/dashboard/ui';

  import {
    ADMIN_USERS_DASHBOARD_ERROR_TEXT,
    ADMIN_USERS_DASHBOARD_TILE_HINT,
    ADMIN_USERS_DASHBOARD_TILE_TITLE,
  } from '../model';

  /** Сколько всего зарегистрировано пользователей — на главной админки. */
  const props = defineProps<{
    hasError: boolean;
    isLoading: boolean;
    total: number | null;
  }>();

  const isPending = computed(
    () => props.isLoading || (!props.hasError && props.total === null),
  );

  const errorText = computed(() =>
    props.hasError ? ADMIN_USERS_DASHBOARD_ERROR_TEXT : undefined,
  );

  const totalValue = computed(() =>
    props.total === null || props.hasError
      ? ADMIN_DASHBOARD_EMPTY_VALUE
      : ADMIN_DASHBOARD_NUMBER_FORMAT.format(props.total),
  );
</script>

<template>
  <AdminStatTile
    :label="ADMIN_USERS_DASHBOARD_TILE_TITLE"
    :value="totalValue"
    :value-hint="ADMIN_USERS_DASHBOARD_TILE_HINT"
    :error-text="errorText"
    :is-pending="isPending"
  />
</template>
